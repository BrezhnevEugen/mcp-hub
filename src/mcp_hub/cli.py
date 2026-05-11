from __future__ import annotations

import argparse
import json
from pathlib import Path
import shlex
import sys

from .config import HubConfig
from .importers import (
    DEFAULT_CLAUDE_DESKTOP_CONFIG,
    DEFAULT_CODEX_CONFIG,
    DEFAULT_CURSOR_CONFIG,
    import_claude_desktop_servers,
    import_codex_servers,
    import_cursor_servers,
)
from .mcp_client import MCPError, list_tools, tools_to_mappings
from .models import ServerConfig
from .scanner import compare_tools
from .web import serve_ui


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="mcp-hub", description="Manage personal MCP servers.")
    parser.add_argument("--home", help="Config directory. Defaults to ~/.mcp-hub or MCP_HUB_HOME.")
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    subparsers.add_parser("init", help="Create config files.")

    add_parser = subparsers.add_parser("add", help="Add or update an MCP server.")
    add_parser.add_argument("name")
    add_parser.add_argument("--command", dest="server_command", required=True, help="Command used to start the MCP server.")
    add_parser.add_argument("--tag", action="append", default=[], help="Tag to attach to the server.")
    add_parser.add_argument("--description", default="")

    subparsers.add_parser("list", help="List registered servers.")

    show_parser = subparsers.add_parser("show", help="Show one registered server.")
    show_parser.add_argument("name")
    show_parser.add_argument("--json", action="store_true", help="Print JSON result.")

    remove_parser = subparsers.add_parser("remove", help="Remove a registered server.")
    remove_parser.add_argument("name")

    enable_parser = subparsers.add_parser("enable", help="Enable a registered server.")
    enable_parser.add_argument("name")

    disable_parser = subparsers.add_parser("disable", help="Disable a registered server.")
    disable_parser.add_argument("name")

    inspect_parser = subparsers.add_parser("inspect", help="Run tools/list against a server.")
    inspect_parser.add_argument("name")
    inspect_parser.add_argument("--json", action="store_true", help="Print raw JSON.")

    status_parser = subparsers.add_parser("status", help="Check registered servers.")
    status_parser.add_argument("--profile", help="Only check servers in a profile.")

    scan_parser = subparsers.add_parser("scan", help="Check tools and diff them against the previous snapshot.")
    scan_parser.add_argument("--profile", help="Only scan servers in a profile.")
    scan_parser.add_argument("--json", action="store_true", help="Print JSON result.")

    profile_parser = subparsers.add_parser("profile", help="Create or update a profile.")
    profile_parser.add_argument("name")
    profile_parser.add_argument("servers", nargs="*")

    export_parser = subparsers.add_parser("export", help="Export MCP config for a client.")
    export_parser.add_argument("client", choices=["codex", "claude-desktop", "cursor"])
    export_parser.add_argument("--profile", default="default")

    import_parser = subparsers.add_parser("import", help="Import MCP servers from another client.")
    import_parser.add_argument("client", choices=["codex", "claude-desktop", "cursor"])
    import_parser.add_argument(
        "--path",
        help=(
            "Client config path. Defaults to "
            f"{DEFAULT_CODEX_CONFIG} for Codex, {DEFAULT_CLAUDE_DESKTOP_CONFIG} for Claude Desktop, "
            f"or {DEFAULT_CURSOR_CONFIG} for Cursor."
        ),
    )

    ui_parser = subparsers.add_parser("ui", help="Start the local MCP Hub visual interface.")
    ui_parser.add_argument("--host", default="127.0.0.1")
    ui_parser.add_argument("--port", type=int, default=8765)

    args = parser.parse_args(argv)
    hub = HubConfig() if args.home is None else HubConfig(config_dir=Path(args.home).expanduser())

    try:
        return _dispatch(args, hub)
    except (MCPError, ValueError, FileNotFoundError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


def _dispatch(args: argparse.Namespace, hub: HubConfig) -> int:
    if args.subcommand == "init":
        hub.init()
        print(f"initialized {hub.config_dir}")
        return 0

    if args.subcommand == "add":
        hub.init()
        servers = hub.load_servers()
        servers[args.name] = ServerConfig(
            name=args.name,
            command=shlex.split(args.server_command),
            tags=args.tag,
            description=args.description,
        )
        hub.save_servers(servers)
        print(f"added {args.name}")
        return 0

    if args.subcommand == "list":
        servers = hub.load_servers()
        if not servers:
            print("no servers registered")
            return 0
        for server in servers.values():
            tags = f" [{', '.join(server.tags)}]" if server.tags else ""
            state = "enabled" if server.enabled else "disabled"
            print(f"{server.name}\t{state}\t{server.transport}\t{_format_server_target(server)}{tags}")
        return 0

    if args.subcommand == "show":
        server = _get_server(hub, args.name)
        data = server.to_mapping()
        if args.json:
            print(json.dumps({server.name: data}, indent=2, ensure_ascii=False))
        else:
            print(f"name: {server.name}")
            print(f"enabled: {str(server.enabled).lower()}")
            print(f"transport: {server.transport}")
            if server.command:
                print(f"command: {_format_command(server.command)}")
            if server.url:
                print(f"url: {_redact_arg(server.url)}")
            if server.headers:
                print(f"headers: {', '.join(sorted(server.headers))}")
            if server.tags:
                print(f"tags: {', '.join(server.tags)}")
            if server.description:
                print(f"description: {server.description}")
            if server.env:
                print(f"env: {', '.join(sorted(server.env))}")
        return 0

    if args.subcommand == "remove":
        servers = hub.load_servers()
        if args.name not in servers:
            raise ValueError(f"unknown server: {args.name}")
        del servers[args.name]
        hub.save_servers(servers)
        _remove_server_from_profiles(hub, args.name)
        print(f"removed {args.name}")
        return 0

    if args.subcommand in {"enable", "disable"}:
        enabled = args.subcommand == "enable"
        servers = hub.load_servers()
        if args.name not in servers:
            raise ValueError(f"unknown server: {args.name}")
        servers[args.name] = servers[args.name].with_enabled(enabled)
        hub.save_servers(servers)
        action = "enabled" if enabled else "disabled"
        print(f"{action} {args.name}")
        return 0

    if args.subcommand == "inspect":
        server = _get_server(hub, args.name)
        if not server.enabled:
            raise ValueError(f"server is disabled: {server.name}")
        tools = list_tools(server)
        _store_server_tools(hub, server.name, tools_to_mappings(tools))
        if args.json:
            print(json.dumps(tools_to_mappings(tools), indent=2, ensure_ascii=False))
        else:
            print(f"{server.name}: {len(tools)} tool(s)")
            for tool in tools:
                suffix = f" - {tool.description}" if tool.description else ""
                print(f"  {tool.name}{suffix}")
        return 0

    if args.subcommand == "status":
        servers = _servers_for_status(hub, args.profile)
        for server in servers:
            try:
                tools = list_tools(server, timeout=5)
            except Exception as exc:
                print(f"{server.name}\tbroken\t{exc}")
            else:
                print(f"{server.name}\tok\t{len(tools)} tool(s)")
        return 0

    if args.subcommand == "scan":
        results = _scan_tools(hub, args.profile)
        if args.json:
            print(json.dumps(results, indent=2, ensure_ascii=False))
        else:
            _print_scan_results(results)
        return 2 if any(item.get("changed") for item in results) else 0

    if args.subcommand == "profile":
        profiles = hub.load_profiles()
        known = set(hub.load_servers())
        missing = sorted(set(args.servers) - known)
        if missing:
            raise ValueError(f"unknown server(s): {', '.join(missing)}")
        profiles[args.name] = args.servers
        hub.save_profiles(profiles)
        print(f"profile {args.name}: {', '.join(args.servers) if args.servers else '(empty)'}")
        return 0

    if args.subcommand == "export":
        payload = _export_config(hub, args.profile)
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return 0

    if args.subcommand == "import":
        imported = _import_servers(args.client, Path(args.path).expanduser() if args.path else None)
        servers = hub.load_servers()
        servers.update(imported)
        hub.save_servers(servers)
        names = ", ".join(sorted(imported)) if imported else "(none)"
        print(f"synced {len(imported)} server(s): {names}")
        return 0

    if args.subcommand == "ui":
        serve_ui(hub, host=args.host, port=args.port)
        return 0

    raise ValueError(f"unknown command: {args.subcommand}")


def _get_server(hub: HubConfig, name: str) -> ServerConfig:
    servers = hub.load_servers()
    try:
        return servers[name]
    except KeyError as exc:
        raise ValueError(f"unknown server: {name}") from exc


def _store_server_tools(hub: HubConfig, name: str, tools: list[dict[str, object]]) -> None:
    servers = hub.load_servers()
    if name not in servers:
        return
    servers[name] = servers[name].with_tools(tools)
    hub.save_servers(servers)


def _servers_for_status(hub: HubConfig, profile: str | None) -> list[ServerConfig]:
    servers = hub.load_servers()
    if profile is None:
        return [server for server in servers.values() if server.enabled]
    profiles = hub.load_profiles()
    if profile not in profiles:
        raise ValueError(f"unknown profile: {profile}")
    return [servers[name] for name in profiles[profile] if name in servers and servers[name].enabled]


def _export_config(hub: HubConfig, profile: str) -> dict[str, object]:
    servers = hub.load_servers()
    profiles = hub.load_profiles()
    if profile not in profiles:
        raise ValueError(f"unknown profile: {profile}")

    selected = {name: servers[name] for name in profiles[profile] if name in servers and servers[name].enabled}
    return {
        "mcpServers": {
            name: {
                **_export_server_config(server),
            }
            for name, server in selected.items()
        }
    }


def _remove_server_from_profiles(hub: HubConfig, server_name: str) -> None:
    profiles = hub.load_profiles()
    changed = False
    for name, server_names in profiles.items():
        filtered = [item for item in server_names if item != server_name]
        if filtered != server_names:
            profiles[name] = filtered
            changed = True
    if changed:
        hub.save_profiles(profiles)


def _add_servers_to_profile(hub: HubConfig, profile_name: str, server_names: list[str]) -> None:
    profiles = hub.load_profiles()
    current = profiles.get(profile_name, [])
    profiles[profile_name] = list(dict.fromkeys([*current, *server_names]))
    hub.save_profiles(profiles)


def _import_servers(client: str, path: Path | None) -> dict[str, ServerConfig]:
    if client == "codex":
        return import_codex_servers(path or DEFAULT_CODEX_CONFIG)
    if client == "claude-desktop":
        return import_claude_desktop_servers(path or DEFAULT_CLAUDE_DESKTOP_CONFIG)
    if client == "cursor":
        if path is not None:
            return import_cursor_servers(path, settings_path=Path("__mcp_hub_missing_cursor_settings__"))
        return import_cursor_servers(path or DEFAULT_CURSOR_CONFIG)
    raise ValueError(f"unsupported import client: {client}")


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
        return _redact_arg(server.url)
    return _format_command(server.command)


def _format_command(command: list[str]) -> str:
    return shlex.join([_redact_arg(arg) for arg in command])


def _redact_arg(value: str) -> str:
    lower = value.lower()
    sensitive_markers = (
        "authorization: bearer ",
        "bearer ",
        "api_key=",
        "apikey=",
        "api-key=",
        "x-goog-api-key",
        "token=",
        "secret=",
    )
    if any(marker in lower for marker in sensitive_markers):
        return _redact_sensitive_value(value)
    return value


def _redact_sensitive_value(value: str) -> str:
    if len(value) <= 12:
        return "[redacted]"
    return f"{value[:8]}...[redacted]"


def _scan_tools(hub: HubConfig, profile: str | None) -> list[dict[str, object]]:
    servers = hub.load_servers()
    selected = _servers_for_status(hub, profile)
    snapshots = hub.load_tool_snapshots()
    results: list[dict[str, object]] = []
    registry_changed = False

    for server in selected:
        try:
            tools = list_tools(server, timeout=5)
        except Exception as exc:
            results.append({"server": server.name, "status": "broken", "error": str(exc), "changed": False})
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
                "tool_count": len(changes.current),
                "first_scan": changes.first_scan,
                "changed": changes.changed,
                "added": changes.added,
                "removed": changes.removed,
            }
        )

    hub.save_tool_snapshots(snapshots)
    if registry_changed:
        hub.save_servers(servers)
    return results


def _print_scan_results(results: list[dict[str, object]]) -> None:
    for item in results:
        server = item["server"]
        if item["status"] != "ok":
            print(f"{server}\tbroken\t{item['error']}")
            continue
        if item["first_scan"]:
            print(f"{server}\tbaseline\t{item['tool_count']} tool(s)")
            continue
        if not item["changed"]:
            print(f"{server}\tunchanged\t{item['tool_count']} tool(s)")
            continue

        print(f"{server}\tchanged\t{item['tool_count']} tool(s)")
        for name in item["added"]:
            print(f"  + {name}")
        for name in item["removed"]:
            print(f"  - {name}")


if __name__ == "__main__":
    raise SystemExit(main())
