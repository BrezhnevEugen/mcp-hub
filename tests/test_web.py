from importlib import resources
from pathlib import Path

from mcp_hub.config import HubConfig
from mcp_hub.mcp_client import ToolInfo
from mcp_hub.models import ServerConfig
from mcp_hub.web import build_state, create_server, delete_server, export_profile, scan_profile
from mcp_hub.web import import_client


def test_build_state_adds_profile_membership(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers({"demo": ServerConfig(name="demo", command=["demo"])})
    hub.save_profiles({"default": ["demo"]})

    state = build_state(hub)

    assert state["servers"][0]["profiles"] == ["default"]


def test_ui_assets_include_documentation_section() -> None:
    ui_files = resources.files("mcp_hub").joinpath("ui")
    html = ui_files.joinpath("index.html").read_text(encoding="utf-8")
    app_js = ui_files.joinpath("app.js").read_text(encoding="utf-8")

    assert 'id="docsOpenBtn"' in html
    assert 'id="docsDialog"' in html
    assert "const DOCS = {" in app_js
    assert "openDocsDialog" in app_js


def test_ui_assets_use_activity_feed_instead_of_main_details() -> None:
    ui_files = resources.files("mcp_hub").joinpath("ui")
    html = ui_files.joinpath("index.html").read_text(encoding="utf-8")
    app_js = ui_files.joinpath("app.js").read_text(encoding="utf-8")

    assert 'id="activityFeed"' in html
    assert 'id="detailsBody"' not in html
    assert "renderActivityFeed" in app_js
    assert "renderDetails" not in app_js


def test_ui_assets_include_progress_summary() -> None:
    ui_files = resources.files("mcp_hub").joinpath("ui")
    html = ui_files.joinpath("index.html").read_text(encoding="utf-8")
    app_js = ui_files.joinpath("app.js").read_text(encoding="utf-8")

    assert 'id="progressStats"' in html
    assert 'id="doneList"' in html
    assert 'id="remainingList"' in html
    assert 'id="serverCount"' not in html
    assert "renderProgressSummary" in app_js
    assert "renderCatalogStats" not in app_js


def test_ui_manual_add_form_keeps_only_name_address_and_token() -> None:
    ui_files = resources.files("mcp_hub").joinpath("ui")
    html = ui_files.joinpath("index.html").read_text(encoding="utf-8")
    app_js = ui_files.joinpath("app.js").read_text(encoding="utf-8")

    assert 'id="addName"' in html
    assert 'id="addUrl"' in html
    assert 'id="addToken"' in html
    assert 'id="addTransport"' not in html
    assert 'id="addCommand"' not in html
    assert 'id="addProfile"' not in html
    assert 'id="addTags"' not in html
    assert 'transport: "http"' in app_js
    assert "authorizationHeader" in app_js


def test_build_state_includes_app_versioning_and_locales(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.init()

    state = build_state(hub)

    assert state["app"] == {
        "name": "MCP Hub",
        "version": "0.1.0",
        "catalogSchemaVersion": 1,
        "uiStateVersion": 2,
        "locales": ["en", "ru"],
        "defaultLocale": "ru",
    }


def test_build_state_includes_recent_events(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.init()
    hub.append_event({"ts": "2026-05-11T10:00:00Z", "kind": "import", "count": 1})

    state = build_state(hub)

    assert state["events"] == [{"ts": "2026-05-11T10:00:00Z", "kind": "import", "count": 1}]


def test_build_state_includes_server_tools(tmp_path: Path) -> None:
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
    hub.save_profiles({"default": ["demo"]})

    state = build_state(hub)

    assert state["servers"][0]["toolCount"] == 1
    assert state["servers"][0]["tools"] == [
        {
            "name": "search",
            "description": "Search records",
        }
    ]


def test_build_state_keeps_access_tokens_visible(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers(
        {
            "demo": ServerConfig(
                name="demo",
                command=[
                    "npx",
                    "mcp-remote",
                    "https://example.com/mcp",
                    "--header",
                    "Authorization: Bearer secret-token",
                ],
                env={"API_TOKEN": "env-secret"},
            ),
            "remote": ServerConfig(
                name="remote",
                transport="http",
                url="https://example.com/mcp?token=query-secret",
                headers={"Authorization": "Bearer header-secret"},
            ),
        }
    )
    hub.save_profiles({"default": ["demo", "remote"]})

    state = build_state(hub)
    servers = {server["name"]: server for server in state["servers"]}

    assert "secret-token" in servers["demo"]["target"]
    assert servers["demo"]["env"] == {"API_TOKEN": "env-secret"}
    assert "query-secret" in servers["remote"]["url"]
    assert servers["remote"]["headers"] == {"Authorization": "Bearer header-secret"}


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


def test_export_profile_keeps_access_tokens_for_agents(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers(
        {
            "stdio": ServerConfig(
                name="stdio",
                command=["server", "--token=stdio-secret"],
                env={"API_TOKEN": "env-secret"},
            ),
            "remote": ServerConfig(
                name="remote",
                transport="http",
                url="https://example.com/mcp",
                headers={"Authorization": "Bearer remote-secret"},
            ),
        }
    )
    hub.save_profiles({"default": ["stdio", "remote"]})

    exported = export_profile(hub, "default", "codex")

    assert exported["mcpServers"]["stdio"]["args"] == ["--token=stdio-secret"]
    assert exported["mcpServers"]["stdio"]["env"] == {"API_TOKEN": "env-secret"}
    assert exported["mcpServers"]["remote"]["headers"] == {"Authorization": "Bearer remote-secret"}


def test_create_server_adds_stdio_server_to_profile(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.init()

    result = create_server(
        hub,
        {
            "name": "demo",
            "transport": "stdio",
            "command": "python3 -m demo.server",
            "profile": "tools",
            "tags": ["local"],
            "env": {"MODE": "dev"},
        },
    )

    assert result == {"server": "demo", "created": True}
    assert hub.load_servers()["demo"].command == ["python3", "-m", "demo.server"]
    assert hub.load_profiles()["tools"] == ["demo"]


def test_create_server_adds_http_server_with_headers_to_profile(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.init()

    result = create_server(
        hub,
        {
            "name": "remote-demo",
            "transport": "http",
            "url": "https://example.com/mcp",
            "profile": "default",
            "tags": ["remote"],
            "headers": {"Authorization": "Bearer secret"},
        },
    )

    server = hub.load_servers()["remote-demo"]
    assert result == {"server": "remote-demo", "created": True}
    assert server.transport == "http"
    assert server.url == "https://example.com/mcp"
    assert server.headers == {"Authorization": "Bearer secret"}
    assert hub.load_profiles()["default"] == ["remote-demo"]


def test_delete_server_removes_from_profiles_and_snapshots(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers({"demo": ServerConfig(name="demo", command=["demo"])})
    hub.save_profiles({"tools": ["demo"]})
    hub.save_tool_snapshots({"demo": ["one"]})

    result = delete_server(hub, {"name": "demo"})

    assert result == {"server": "demo", "deleted": True}
    assert hub.load_servers() == {}
    assert hub.load_profiles()["tools"] == []
    assert hub.load_tool_snapshots() == {}


def test_import_client_does_not_assign_profiles(tmp_path: Path) -> None:
    hub = HubConfig(tmp_path)
    hub.init()
    config = tmp_path / "codex.toml"
    config.write_text(
        """
[mcp_servers.demo]
command = "demo"
args = ["--mcp"]
""".strip(),
        encoding="utf-8",
    )

    result = import_client(hub, {"client": "codex", "path": str(config), "profile": "default"})

    assert result == {"imported": ["demo"]}
    assert "demo" in hub.load_servers()
    assert hub.load_profiles()["default"] == []


def test_scan_profile_stores_discovered_tools(tmp_path: Path, monkeypatch) -> None:
    hub = HubConfig(tmp_path)
    hub.save_servers({"demo": ServerConfig(name="demo", command=["demo"])})
    hub.save_profiles({"default": ["demo"]})

    def fake_list_tools(server: ServerConfig, timeout: int = 5) -> list[ToolInfo]:
        return [
            ToolInfo(
                name="search",
                description="Search records",
                input_schema={"type": "object"},
            )
        ]

    monkeypatch.setattr("mcp_hub.web.list_tools", fake_list_tools)

    result = scan_profile(hub, "default")

    assert result["results"][0]["toolCount"] == 1
    assert hub.load_servers()["demo"].tools == [
        {
            "name": "search",
            "description": "Search records",
            "inputSchema": {"type": "object"},
        }
    ]
