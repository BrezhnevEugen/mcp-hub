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
