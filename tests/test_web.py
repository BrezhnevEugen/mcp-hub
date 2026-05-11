from pathlib import Path

from mcp_hub.config import HubConfig
from mcp_hub.models import ServerConfig
from mcp_hub.web import build_state, export_profile


def test_build_state_adds_profile_membership(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers({"demo": ServerConfig(name="demo", command=["demo"])})
    hub.save_profiles({"default": ["demo"]})

    state = build_state(hub)

    assert state["servers"][0]["profiles"] == ["default"]


def test_export_profile_supports_synthetic_all(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers(
        {
            "enabled": ServerConfig(name="enabled", command=["enabled"]),
            "disabled": ServerConfig(name="disabled", command=["disabled"], enabled=False),
        }
    )
    hub.save_profiles({"default": ["enabled"]})

    exported = export_profile(hub, "all", "codex")

    assert sorted(exported["mcpServers"]) == ["enabled"]
