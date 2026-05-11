from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import yaml

from .models import ServerConfig


DEFAULT_CONFIG_DIR = Path(os.environ.get("MCP_HUB_HOME", "~/.mcp-hub")).expanduser()


class HubConfig:
    def __init__(self, config_dir: Path = DEFAULT_CONFIG_DIR) -> None:
        self.config_dir = config_dir
        self.registry_path = config_dir / "registry.yaml"
        self.profiles_path = config_dir / "profiles.yaml"
        self.snapshots_path = config_dir / "tool-snapshots.yaml"
        self.events_path = config_dir / "events.jsonl"

    def init(self) -> None:
        self.config_dir.mkdir(parents=True, exist_ok=True)
        if not self.registry_path.exists():
            self._write_yaml(self.registry_path, {"servers": {}})
        if not self.profiles_path.exists():
            self._write_yaml(self.profiles_path, {"profiles": {"default": {"servers": []}}})

    def load_servers(self) -> dict[str, ServerConfig]:
        data = self._read_yaml(self.registry_path, default={"servers": {}})
        servers = data.get("servers", {})
        if not isinstance(servers, dict):
            raise ValueError("registry.yaml must contain a servers mapping")
        return {name: ServerConfig.from_mapping(name, value) for name, value in servers.items()}

    def save_servers(self, servers: dict[str, ServerConfig]) -> None:
        self.init()
        data = {"servers": {name: server.to_mapping() for name, server in sorted(servers.items())}}
        self._write_yaml(self.registry_path, data)

    def load_profiles(self) -> dict[str, list[str]]:
        data = self._read_yaml(self.profiles_path, default={"profiles": {"default": {"servers": []}}})
        profiles = data.get("profiles", {})
        if not isinstance(profiles, dict):
            raise ValueError("profiles.yaml must contain a profiles mapping")

        result: dict[str, list[str]] = {}
        for name, profile in profiles.items():
            if isinstance(profile, dict):
                servers = profile.get("servers", [])
            else:
                servers = profile
            if not isinstance(servers, list) or not all(isinstance(item, str) for item in servers):
                raise ValueError(f"profile {name!r} must contain a server name list")
            result[name] = servers
        return result

    def save_profiles(self, profiles: dict[str, list[str]]) -> None:
        self.init()
        data = {"profiles": {name: {"servers": servers} for name, servers in sorted(profiles.items())}}
        self._write_yaml(self.profiles_path, data)

    def load_tool_snapshots(self) -> dict[str, list[str]]:
        data = self._read_yaml(self.snapshots_path, default={"servers": {}})
        servers = data.get("servers", {})
        if not isinstance(servers, dict):
            raise ValueError("tool-snapshots.yaml must contain a servers mapping")
        result: dict[str, list[str]] = {}
        for name, tools in servers.items():
            if not isinstance(tools, list) or not all(isinstance(item, str) for item in tools):
                raise ValueError(f"snapshot for {name!r} must be a tool name list")
            result[name] = tools
        return result

    def save_tool_snapshots(self, snapshots: dict[str, list[str]]) -> None:
        self.init()
        data = {"servers": {name: sorted(tools) for name, tools in sorted(snapshots.items())}}
        self._write_yaml(self.snapshots_path, data)

    def load_events(self, limit: int = 30) -> list[dict[str, Any]]:
        if not self.events_path.exists():
            return []
        events: list[dict[str, Any]] = []
        with self.events_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(event, dict):
                    events.append(event)
        return events[-limit:][::-1]

    def append_event(self, event: dict[str, Any]) -> None:
        self.init()
        self.events_path.parent.mkdir(parents=True, exist_ok=True)
        with self.events_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(event, ensure_ascii=False, sort_keys=True) + "\n")

    def _read_yaml(self, path: Path, default: dict[str, Any]) -> dict[str, Any]:
        if not path.exists():
            return default
        with path.open("r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle) or {}
        if not isinstance(data, dict):
            raise ValueError(f"{path} must contain a YAML mapping")
        return data

    def _write_yaml(self, path: Path, data: dict[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False)
