from pathlib import Path

from mcp_hub.importers import import_codex_servers


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
