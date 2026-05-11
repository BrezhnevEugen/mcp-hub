from pathlib import Path

from mcp_hub.importers import import_claude_desktop_servers, import_codex_servers, import_cursor_servers


def test_import_codex_servers(tmp_path: Path) -> None:
    config = tmp_path / "config.toml"
    config.write_text(
        """
[mcp_servers.demo]
command = "/bin/demo"
args = ["--mcp"]
env = { TOKEN = "secret" }
""".strip(),
        encoding="utf-8",
    )

    servers = import_codex_servers(config)

    assert servers["demo"].command == ["/bin/demo", "--mcp"]
    assert servers["demo"].env == {"TOKEN": "secret"}
    assert servers["demo"].tags == ["codex-import"]


def test_import_claude_desktop_servers(tmp_path: Path) -> None:
    config = tmp_path / "claude_desktop_config.json"
    config.write_text(
        """
{
  "mcpServers": {
    "demo": {
      "command": "/bin/demo",
      "args": ["--mcp"],
      "env": {"TOKEN": "secret"}
    }
  },
  "preferences": {
    "sidebarMode": "task"
  }
}
""".strip(),
        encoding="utf-8",
    )

    servers = import_claude_desktop_servers(config)

    assert servers["demo"].command == ["/bin/demo", "--mcp"]
    assert servers["demo"].env == {"TOKEN": "secret"}
    assert servers["demo"].tags == ["claude-import"]


def test_import_cursor_servers_reads_stdio_and_remote_servers(tmp_path: Path) -> None:
    config = tmp_path / "mcp.json"
    settings = tmp_path / "settings.json"
    config.write_text(
        """
{
  "mcpServers": {
    "demo": {
      "command": "/bin/demo",
      "args": ["--mcp"]
    },
    "remote": {
      "url": "https://example.com/mcp",
      "headers": {"X-Goog-Api-Key": "secret"}
    }
  }
}
""".strip(),
        encoding="utf-8",
    )
    settings.write_text(
        """
{
  "mcpServers": {
    "settings-demo": {
      "command": "node",
      "args": ["server.js"],
      "env": {"TOKEN": "secret"}
    }
  }
}
""".strip(),
        encoding="utf-8",
    )

    servers = import_cursor_servers(config, settings)

    assert servers["demo"].command == ["/bin/demo", "--mcp"]
    assert servers["demo"].tags == ["cursor-import"]
    assert servers["remote"].transport == "http"
    assert servers["remote"].url == "https://example.com/mcp"
    assert servers["remote"].headers == {"X-Goog-Api-Key": "secret"}
    assert servers["settings-demo"].command == ["node", "server.js"]
    assert servers["settings-demo"].tags == ["cursor-settings-import"]
