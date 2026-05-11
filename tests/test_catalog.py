from pathlib import Path

import yaml

from mcp_hub.catalog import generate_catalog
from mcp_hub.models import ServerConfig


def test_generate_catalog_sanitizes_secrets(tmp_path: Path) -> None:
    servers = {
        "remote": ServerConfig(
            name="remote",
            transport="http",
            url="https://example.com/mcp",
            headers={"X-Goog-Api-Key": "secret-value"},
        ),
        "auth": ServerConfig(
            name="auth",
            command=["npx", "--header", "Authorization: Bearer secret-token"],
        ),
    }
    profiles = {"default": ["remote", "auth"]}

    servers_path, profiles_path = generate_catalog(servers, profiles, tmp_path / "catalog")

    servers_data = yaml.safe_load(servers_path.read_text(encoding="utf-8"))
    profiles_data = yaml.safe_load(profiles_path.read_text(encoding="utf-8"))
    rendered = servers_path.read_text(encoding="utf-8")

    assert "secret-value" not in rendered
    assert "secret-token" not in rendered
    assert servers_data["servers"]["remote"]["headers"]["X-Goog-Api-Key"] == "${MCP_HUB_SECRET_REMOTE_X_GOOG_API_KEY}"
    assert servers_data["servers"]["auth"]["command"][-1] == "Authorization: Bearer ${MCP_HUB_SECRET_AUTH_ARG}"
    assert profiles_data["profiles"]["default"]["servers"] == ["remote", "auth"]
    assert profiles_data["profiles"]["all"]["servers"] == ["auth", "remote"]


def test_generate_catalog_keeps_non_secret_env_values(tmp_path: Path) -> None:
    servers = {
        "demo": ServerConfig(
            name="demo",
            command=["node", "server.js"],
            env={"NODE_ENV": "production", "API_TOKEN": "secret"},
        )
    }

    servers_path, _ = generate_catalog(servers, {"default": ["demo"]}, tmp_path / "catalog")

    servers_data = yaml.safe_load(servers_path.read_text(encoding="utf-8"))
    env = servers_data["servers"]["demo"]["env"]
    assert env["NODE_ENV"] == "production"
    assert env["API_TOKEN"] == "${MCP_HUB_SECRET_DEMO_API_TOKEN}"


def test_generate_catalog_skips_disabled_servers(tmp_path: Path) -> None:
    servers = {
        "enabled": ServerConfig(name="enabled", command=["server"]),
        "disabled": ServerConfig(name="disabled", command=["server"], enabled=False),
    }

    servers_path, profiles_path = generate_catalog(servers, {"default": ["enabled", "disabled"]}, tmp_path / "catalog")

    servers_data = yaml.safe_load(servers_path.read_text(encoding="utf-8"))
    profiles_data = yaml.safe_load(profiles_path.read_text(encoding="utf-8"))
    assert sorted(servers_data["servers"]) == ["enabled"]
    assert profiles_data["profiles"]["default"]["servers"] == ["enabled"]
