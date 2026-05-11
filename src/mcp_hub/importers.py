from __future__ import annotations

from pathlib import Path
import tomllib

from .models import ServerConfig


DEFAULT_CODEX_CONFIG = Path("~/.codex/config.toml").expanduser()


def import_codex_servers(config_path: Path = DEFAULT_CODEX_CONFIG) -> dict[str, ServerConfig]:
    if not config_path.exists():
        raise FileNotFoundError(config_path)

    with config_path.open("rb") as handle:
        data = tomllib.load(handle)

    raw_servers = data.get("mcp_servers", {})
    if not isinstance(raw_servers, dict):
        raise ValueError("Codex config mcp_servers must be a mapping")

    servers: dict[str, ServerConfig] = {}
    for name, raw in raw_servers.items():
        if not isinstance(raw, dict):
            raise ValueError(f"Codex MCP server {name!r} must be a mapping")
        command = raw.get("command")
        if not isinstance(command, str):
            raise ValueError(f"Codex MCP server {name!r} must define command")
        args = raw.get("args", [])
        if not isinstance(args, list) or not all(isinstance(item, str) for item in args):
            raise ValueError(f"Codex MCP server {name!r} args must be a list of strings")
        env = raw.get("env", {})
        if not isinstance(env, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in env.items()):
            raise ValueError(f"Codex MCP server {name!r} env must be a string map")
        servers[name] = ServerConfig(
            name=name,
            command=[command, *args],
            env=env,
            tags=["codex-import"],
            description="Imported from Codex config.",
        )

    return servers
