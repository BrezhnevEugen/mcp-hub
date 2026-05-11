from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Any


@dataclass(frozen=True)
class ServerConfig:
    name: str
    command: list[str] = field(default_factory=list)
    transport: str = "stdio"
    env: dict[str, str] = field(default_factory=dict)
    url: str = ""
    headers: dict[str, str] = field(default_factory=dict)
    tags: list[str] = field(default_factory=list)
    description: str = ""
    enabled: bool = True

    def with_enabled(self, enabled: bool) -> "ServerConfig":
        return replace(self, enabled=enabled)

    @classmethod
    def from_mapping(cls, name: str, data: dict[str, Any]) -> "ServerConfig":
        transport = data.get("transport", "stdio")
        if transport not in {"stdio", "http"}:
            raise ValueError(f"server {name!r} uses unsupported transport {transport!r}")

        command = data.get("command")
        if isinstance(command, str):
            command = [command]
        if command is None:
            command = []
        if not isinstance(command, list) or not all(isinstance(item, str) for item in command):
            raise ValueError(f"server {name!r} must define command as a list of strings")
        if transport == "stdio" and not command:
            raise ValueError(f"server {name!r} must define command for stdio transport")

        url = data.get("url", "")
        if not isinstance(url, str):
            raise ValueError(f"server {name!r} url must be a string")
        if transport == "http" and not url:
            raise ValueError(f"server {name!r} must define url for http transport")

        headers = data.get("headers", {})
        if not isinstance(headers, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in headers.items()):
            raise ValueError(f"server {name!r} headers must be a string map")

        env = data.get("env", {})
        if not isinstance(env, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in env.items()):
            raise ValueError(f"server {name!r} env must be a string map")

        tags = data.get("tags", [])
        if not isinstance(tags, list) or not all(isinstance(item, str) for item in tags):
            raise ValueError(f"server {name!r} tags must be a list of strings")

        return cls(
            name=name,
            command=command,
            transport=transport,
            env=env,
            url=url,
            headers=headers,
            tags=tags,
            description=str(data.get("description", "")),
            enabled=bool(data.get("enabled", True)),
        )

    def to_mapping(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "transport": self.transport,
            "enabled": self.enabled,
        }
        if self.command:
            data["command"] = self.command
        if self.url:
            data["url"] = self.url
        if self.headers:
            data["headers"] = self.headers
        if self.tags:
            data["tags"] = self.tags
        if self.description:
            data["description"] = self.description
        if self.env:
            data["env"] = self.env
        return data
