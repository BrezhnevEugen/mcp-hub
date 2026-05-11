from mcp_hub.cli import _format_command, _format_server_target, _server_client_config
from mcp_hub.models import ServerConfig


def test_format_command_redacts_bearer_tokens() -> None:
    command = ["npx", "--header", "Authorization: Bearer sk-secret-token"]

    rendered = _format_command(command)

    assert "sk-secret-token" not in rendered
    assert "[redacted]" in rendered


def test_format_command_redacts_token_assignments() -> None:
    command = ["server", "--token=abc123secret"]

    rendered = _format_command(command)

    assert "abc123secret" not in rendered
    assert "[redacted]" in rendered


def test_format_server_target_uses_url_for_remote_server() -> None:
    server = ServerConfig(name="remote", transport="http", url="https://example.com/mcp")

    assert _format_server_target(server) == "https://example.com/mcp"


def test_server_client_config_supports_remote_server() -> None:
    server = ServerConfig(
        name="remote",
        transport="http",
        url="https://example.com/mcp",
        headers={"X-Goog-Api-Key": "secret"},
    )

    assert _server_client_config(server) == {
        "url": "https://example.com/mcp",
        "headers": {"X-Goog-Api-Key": "secret"},
    }
