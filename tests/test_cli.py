from mcp_hub.cli import _format_command


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
