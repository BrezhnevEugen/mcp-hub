from __future__ import annotations

import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib import resources
from pathlib import Path
import shlex
from typing import Any
from urllib.parse import parse_qs, urlparse

from .config import HubConfig
from .importers import (
    DEFAULT_CLAUDE_DESKTOP_CONFIG,
    DEFAULT_CODEX_CONFIG,
    DEFAULT_CURSOR_CONFIG,
    import_claude_desktop_servers,
    import_codex_servers,
    import_cursor_servers,
)
from .mcp_client import list_tools, tools_to_mappings
from .models import ServerConfig
from .scanner import compare_tools


def serve_ui(hub: HubConfig, host: str = "127.0.0.1", port: int = 8765) -> None:
    hub.init()

    class Handler(MCPHubHandler):
        config = hub

    server = ThreadingHTTPServer((host, port), Handler)
    print(f"MCP Hub UI: http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nMCP Hub UI stopped")


class MCPHubHandler(BaseHTTPRequestHandler):
    config: HubConfig

    def log_message(self, format: str, *args: object) -> None:
        return

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/":
                self._send_asset("index.html", "text/html; charset=utf-8")
            elif parsed.path == "/assets/styles.css":
                self._send_asset("styles.css", "text/css; charset=utf-8")
            elif parsed.path == "/assets/app.js":
                self._send_asset("app.js", "application/javascript; charset=utf-8")
            elif parsed.path == "/api/state":
                self._send_json(build_state(self.config))
            elif parsed.path == "/api/export":
                params = parse_qs(parsed.query)
                profile = _single(params, "profile", "default")
                client = _single(params, "client", "codex")
                self._send_json(export_profile(self.config, profile, client))
            else:
                self._send_json({"error": "not found"}, HTTPStatus.NOT_FOUND)
        except Exception as exc:
            self._send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            payload = self._read_json()
            if parsed.path == "/api/import":
                self._send_json(import_client(self.config, payload))
            elif parsed.path == "/api/server":
                self._send_json(update_server(self.config, payload))
            elif parsed.path == "/api/profile":
                self._send_json(update_profile(self.config, payload))
            elif parsed.path == "/api/scan":
                self._send_json(scan_profile(self.config, payload.get("profile")))
            else:
                self._send_json({"error": "not found"}, HTTPStatus.NOT_FOUND)
        except Exception as exc:
            self._send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        data = self.rfile.read(length)
        parsed = json.loads(data.decode("utf-8"))
        if not isinstance(parsed, dict):
            raise ValueError("request body must be a JSON object")
        return parsed

    def _send_asset(self, name: str, content_type: str) -> None:
        data = resources.files("mcp_hub").joinpath("ui", name).read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_json(self, payload: dict[str, Any] | list[Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        data = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def build_state(hub: HubConfig) -> dict[str, Any]:
    servers = hub.load_servers()
    profiles = hub.load_profiles()
    server_profiles: dict[str, list[str]] = {name: [] for name in servers}
    for profile_name, server_names in profiles.items():
        for server_name in server_names:
            if server_name in server_profiles:
                server_profiles[server_name].append(profile_name)

    return {
        "configDir": str(hub.config_dir),
        "registryPath": str(hub.registry_path),
        "profilesPath": str(hub.profiles_path),
        "servers": [
            _server_payload(server, server_profiles.get(name, []))
            for name, server in sorted(servers.items())
        ],
        "profiles": [
            {"name": name, "servers": server_names}
            for name, server_names in sorted(profiles.items())
        ],
        "clients": ["codex", "claude-desktop", "cursor"],
    }


def import_client(hub: HubConfig, payload: dict[str, Any]) -> dict[str, Any]:
    client = str(payload.get("client", ""))
    path = payload.get("path")
    imported = _import_servers(client, Path(str(path)).expanduser() if path else None)
    servers = hub.load_servers()
    servers.update(imported)
    hub.save_servers(servers)
    return {"imported": sorted(imported)}


def update_server(hub: HubConfig, payload: dict[str, Any]) -> dict[str, Any]:
    action = str(payload.get("action", "update"))
    if action == "create":
        return create_server(hub, payload)
    if action == "delete":
        return delete_server(hub, payload)

    name = str(payload.get("name", ""))
    enabled = payload.get("enabled")
    if not name:
        raise ValueError("name is required")
    if not isinstance(enabled, bool):
        raise ValueError("enabled must be a boolean")
    servers = hub.load_servers()
    if name not in servers:
        raise ValueError(f"unknown server: {name}")
    servers[name] = servers[name].with_enabled(enabled)
    hub.save_servers(servers)
    return {"server": name, "enabled": enabled}


def create_server(hub: HubConfig, payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name", "")).strip()
    transport = str(payload.get("transport", "stdio")).strip()
    profile = str(payload.get("profile", "")).strip()
    description = str(payload.get("description", "")).strip()
    tags = _string_list(payload.get("tags", []))
    env = _string_map(payload.get("env", {}), "env")
    headers = _string_map(payload.get("headers", {}), "headers")

    if not name:
        raise ValueError("name is required")
    if transport not in {"stdio", "http"}:
        raise ValueError("transport must be stdio or http")

    if transport == "stdio":
        command_text = str(payload.get("command", "")).strip()
        if not command_text:
            raise ValueError("command is required for stdio servers")
        server = ServerConfig(
            name=name,
            transport="stdio",
            command=shlex.split(command_text),
            env=env,
            tags=tags,
            description=description,
        )
    else:
        url = str(payload.get("url", "")).strip()
        if not url:
            raise ValueError("url is required for remote servers")
        server = ServerConfig(
            name=name,
            transport="http",
            url=url,
            headers=headers,
            tags=tags,
            description=description,
        )

    servers = hub.load_servers()
    servers[name] = server
    hub.save_servers(servers)
    if profile:
        profiles = hub.load_profiles()
        current = profiles.get(profile, [])
        profiles[profile] = list(dict.fromkeys([*current, name]))
        hub.save_profiles(profiles)
    return {"server": name, "created": True}


def delete_server(hub: HubConfig, payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name", "")).strip()
    if not name:
        raise ValueError("name is required")
    servers = hub.load_servers()
    if name not in servers:
        raise ValueError(f"unknown server: {name}")
    del servers[name]
    hub.save_servers(servers)

    profiles = hub.load_profiles()
    for profile_name, server_names in list(profiles.items()):
        profiles[profile_name] = [server_name for server_name in server_names if server_name != name]
    hub.save_profiles(profiles)

    snapshots = hub.load_tool_snapshots()
    if name in snapshots:
        del snapshots[name]
        hub.save_tool_snapshots(snapshots)
    return {"server": name, "deleted": True}


def update_profile(hub: HubConfig, payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name", ""))
    server_names = payload.get("servers", [])
    if not name:
        raise ValueError("name is required")
    if not isinstance(server_names, list) or not all(isinstance(item, str) for item in server_names):
        raise ValueError("servers must be a list of strings")
    known = set(hub.load_servers())
    missing = sorted(set(server_names) - known)
    if missing:
        raise ValueError(f"unknown server(s): {', '.join(missing)}")
    profiles = hub.load_profiles()
    profiles[name] = server_names
    hub.save_profiles(profiles)
    return {"profile": name, "servers": server_names}


def export_profile(hub: HubConfig, profile: str, client: str) -> dict[str, Any]:
    if client not in {"codex", "claude-desktop", "cursor"}:
        raise ValueError(f"unsupported client: {client}")
    servers = hub.load_servers()
    profiles = hub.load_profiles()
    if profile == "all":
        selected_names = sorted(name for name, server in servers.items() if server.enabled)
    elif profile in profiles:
        selected_names = [name for name in profiles[profile] if name in servers and servers[name].enabled]
    else:
        raise ValueError(f"unknown profile: {profile}")
    return {
        "mcpServers": {
            name: _export_server_config(servers[name])
            for name in selected_names
        }
    }


def scan_profile(hub: HubConfig, profile: str | None) -> dict[str, Any]:
    servers = hub.load_servers()
    profiles = hub.load_profiles()
    if profile:
        if profile not in profiles:
            raise ValueError(f"unknown profile: {profile}")
        selected = [servers[name] for name in profiles[profile] if name in servers and servers[name].enabled]
    else:
        selected = [server for server in servers.values() if server.enabled]

    snapshots = hub.load_tool_snapshots()
    results: list[dict[str, Any]] = []
    registry_changed = False
    for server in selected:
        if server.transport != "stdio":
            results.append({"server": server.name, "status": "skipped", "reason": "remote transport"})
            continue
        try:
            tools = list_tools(server, timeout=5)
        except Exception as exc:
            results.append({"server": server.name, "status": "broken", "error": str(exc)})
            continue
        previous = snapshots.get(server.name)
        changes = compare_tools(server.name, tools, previous)
        snapshots[server.name] = changes.current
        servers[server.name] = server.with_tools(tools_to_mappings(tools))
        registry_changed = True
        results.append(
            {
                "server": server.name,
                "status": "ok",
                "toolCount": len(changes.current),
                "changed": changes.changed,
                "firstScan": changes.first_scan,
                "added": changes.added,
                "removed": changes.removed,
            }
        )
    hub.save_tool_snapshots(snapshots)
    if registry_changed:
        hub.save_servers(servers)
    return {"results": results}


def _import_servers(client: str, path: Path | None) -> dict[str, ServerConfig]:
    if client == "codex":
        return import_codex_servers(path or DEFAULT_CODEX_CONFIG)
    if client == "claude-desktop":
        return import_claude_desktop_servers(path or DEFAULT_CLAUDE_DESKTOP_CONFIG)
    if client == "cursor":
        if path is not None:
            return import_cursor_servers(path, settings_path=Path("__mcp_hub_missing_cursor_settings__"))
        return import_cursor_servers(path or DEFAULT_CURSOR_CONFIG)
    raise ValueError(f"unsupported client: {client}")


def _server_payload(server: ServerConfig, profiles: list[str]) -> dict[str, Any]:
    return {
        "name": server.name,
        "enabled": server.enabled,
        "transport": server.transport,
        "target": _format_server_target(server),
        "command": _format_command(server.command) if server.command else "",
        "url": _redact_value(server.url) if server.url else "",
        "tags": server.tags,
        "profiles": sorted(profiles),
        "description": server.description,
        "envKeys": sorted(server.env),
        "headerKeys": sorted(server.headers),
        "toolCount": len(server.tools),
        "tools": [
            {
                "name": tool["name"],
                "description": str(tool.get("description", "")),
                "hasInputSchema": isinstance(tool.get("inputSchema"), dict),
                **({"inputSchema": tool["inputSchema"]} if isinstance(tool.get("inputSchema"), dict) else {}),
            }
            for tool in server.tools
        ],
    }


def _export_server_config(server: ServerConfig) -> dict[str, object]:
    if server.transport == "http":
        return {
            "url": server.url,
            **({"headers": server.headers} if server.headers else {}),
        }
    return {
        "command": server.command[0],
        "args": server.command[1:],
        **({"env": server.env} if server.env else {}),
    }


def _format_server_target(server: ServerConfig) -> str:
    if server.transport == "http":
        return _redact_value(server.url)
    return _format_command(server.command)


def _format_command(command: list[str]) -> str:
    return " ".join(_shell_quote(_redact_value(arg)) for arg in command)


def _redact_value(value: str) -> str:
    lower = value.lower()
    markers = ("authorization: bearer ", "bearer ", "api_key=", "apikey=", "api-key=", "x-goog-api-key", "token=", "secret=")
    if any(marker in lower for marker in markers):
        return value[:8] + "...[redacted]" if len(value) > 12 else "[redacted]"
    return value


def _shell_quote(value: str) -> str:
    if not value:
        return "''"
    if any(char.isspace() for char in value):
        return "'" + value.replace("'", "'\"'\"'") + "'"
    return value


def _single(params: dict[str, list[str]], key: str, default: str) -> str:
    values = params.get(key)
    if not values:
        return default
    return values[0]


def _string_list(value: object) -> list[str]:
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    if isinstance(value, list) and all(isinstance(item, str) for item in value):
        return value
    raise ValueError("tags must be a list of strings")


def _string_map(value: object, name: str) -> dict[str, str]:
    if value in ({}, None, ""):
        return {}
    if isinstance(value, str):
        parsed = json.loads(value)
    else:
        parsed = value
    if not isinstance(parsed, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in parsed.items()):
        raise ValueError(f"{name} must be a string map")
    return parsed
