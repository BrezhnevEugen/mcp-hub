from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml

from .models import ServerConfig


SECRET_TEMPLATE = "${MCP_HUB_SECRET_%s}"


def generate_catalog(
    servers: dict[str, ServerConfig],
    profiles: dict[str, list[str]],
    output_dir: Path,
) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    servers_path = output_dir / "servers.yaml"
    profiles_path = output_dir / "profiles.yaml"

    catalog_servers = {
        name: _catalog_server(name, server)
        for name, server in sorted(servers.items())
        if server.enabled
    }
    catalog_profiles = _catalog_profiles(catalog_servers, profiles)

    _write_yaml(servers_path, {"version": 1, "servers": catalog_servers})
    _write_yaml(profiles_path, {"version": 1, "profiles": catalog_profiles})
    return servers_path, profiles_path


def _catalog_server(name: str, server: ServerConfig) -> dict[str, Any]:
    data: dict[str, Any] = {
        "transport": server.transport,
    }
    if server.command:
        data["command"] = _sanitize_command(name, server.command)
    if server.url:
        data["url"] = server.url
    if server.headers:
        data["headers"] = _secret_placeholders(name, server.headers)
    if server.env:
        data["env"] = _sanitize_env(name, server.env)
    if server.tags:
        tags = _catalog_tags(server.tags)
        if tags:
            data["tags"] = tags
    if server.description:
        data["description"] = server.description
    return data


def _catalog_profiles(
    catalog_servers: dict[str, dict[str, Any]],
    profiles: dict[str, list[str]],
) -> dict[str, dict[str, list[str]]]:
    known = set(catalog_servers)
    result: dict[str, dict[str, list[str]]] = {}
    for name, server_names in sorted(profiles.items()):
        selected = [server_name for server_name in server_names if server_name in known]
        if selected:
            result[name] = {"servers": selected}
    result.setdefault("all", {"servers": sorted(known)})
    return result


def _catalog_tags(tags: list[str]) -> list[str]:
    return [tag for tag in tags if not tag.endswith("-import")]


def _secret_placeholders(server_name: str, values: dict[str, str]) -> dict[str, str]:
    return {
        key: SECRET_TEMPLATE % _secret_name(server_name, key)
        for key in sorted(values)
    }


def _sanitize_env(server_name: str, values: dict[str, str]) -> dict[str, str]:
    result: dict[str, str] = {}
    for key, value in sorted(values.items()):
        if _sensitive_key(key) or _looks_sensitive(value):
            result[key] = SECRET_TEMPLATE % _secret_name(server_name, key)
        else:
            result[key] = value
    return result


def _sensitive_key(key: str) -> bool:
    lower = key.lower()
    return any(marker in lower for marker in ("token", "secret", "password", "api_key", "apikey", "api-key", "auth"))


def _sanitize_command(server_name: str, command: list[str]) -> list[str]:
    result: list[str] = []
    for arg in command:
        if _looks_sensitive(arg):
            result.append(_sanitize_sensitive_arg(server_name, arg))
        else:
            result.append(arg)
    return result


def _looks_sensitive(value: str) -> bool:
    lower = value.lower()
    return any(
        marker in lower
        for marker in (
            "authorization: bearer ",
            "bearer ",
            "api_key=",
            "apikey=",
            "api-key=",
            "x-goog-api-key",
            "token=",
            "secret=",
        )
    )


def _sanitize_sensitive_arg(server_name: str, value: str) -> str:
    placeholder = SECRET_TEMPLATE % _secret_name(server_name, "arg")
    bearer = re.match(r"^(authorization:\s*bearer\s+).+$", value, flags=re.IGNORECASE)
    if bearer:
        return f"{bearer.group(1)}{placeholder}"
    assignment = re.match(r"^([^=]+=).+$", value)
    if assignment:
        return f"{assignment.group(1)}{placeholder}"
    return placeholder


def _secret_name(server_name: str, key: str) -> str:
    raw = f"{server_name}_{key}"
    return re.sub(r"[^A-Za-z0-9]+", "_", raw).strip("_").upper()


def _write_yaml(path: Path, data: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)
