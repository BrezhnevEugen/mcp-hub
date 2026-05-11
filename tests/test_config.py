from pathlib import Path

from mcp_hub.config import HubConfig
from mcp_hub.models import ServerConfig


def test_save_and_load_servers(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers(
        {
            "demo": ServerConfig(
                name="demo",
                command=["python3", "-m", "demo"],
                tags=["test"],
                description="Demo server",
            )
        }
    )

    servers = hub.load_servers()

    assert servers["demo"].command == ["python3", "-m", "demo"]
    assert servers["demo"].tags == ["test"]


def test_save_and_load_profiles(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_profiles({"content": ["yt-sub"]})

    assert hub.load_profiles() == {"content": ["yt-sub"]}


def test_server_enabled_roundtrip(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers({"demo": ServerConfig(name="demo", command=["demo"], enabled=False)})

    assert hub.load_servers()["demo"].enabled is False


def test_remote_server_roundtrip(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers(
        {
            "remote": ServerConfig(
                name="remote",
                transport="http",
                url="https://example.com/mcp",
                headers={"Authorization": "Bearer secret"},
            )
        }
    )

    server = hub.load_servers()["remote"]
    assert server.transport == "http"
    assert server.url == "https://example.com/mcp"
    assert server.headers == {"Authorization": "Bearer secret"}


def test_server_tools_roundtrip(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers(
        {
            "demo": ServerConfig(
                name="demo",
                command=["demo"],
                tools=[
                    {
                        "name": "search",
                        "description": "Search records",
                        "inputSchema": {"type": "object"},
                    }
                ],
            )
        }
    )

    server = hub.load_servers()["demo"]

    assert server.tools == [
        {
            "name": "search",
            "description": "Search records",
            "inputSchema": {"type": "object"},
        }
    ]


def test_events_roundtrip_returns_newest_first(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)

    hub.append_event({"ts": "2026-05-11T10:00:00Z", "kind": "import", "count": 1})
    hub.append_event({"ts": "2026-05-11T10:01:00Z", "kind": "scan", "scanned": 2})

    assert hub.load_events() == [
        {"ts": "2026-05-11T10:01:00Z", "kind": "scan", "scanned": 2},
        {"ts": "2026-05-11T10:00:00Z", "kind": "import", "count": 1},
    ]
    assert hub.load_events(limit=1) == [
        {"ts": "2026-05-11T10:01:00Z", "kind": "scan", "scanned": 2}
    ]
