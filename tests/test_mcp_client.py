import io
import json
from pathlib import Path

from mcp_hub.mcp_client import list_tools, run_http_stdio_proxy
from mcp_hub.models import ServerConfig


def test_list_tools_reads_stdio_mcp_response(tmp_path: Path) -> None:
    server_file = tmp_path / "fake_mcp.py"
    server_file.write_text(
        """
import json
import sys

for line in sys.stdin:
    message = json.loads(line)
    if message.get("method") == "tools/list":
        print(json.dumps({
            "jsonrpc": "2.0",
            "id": message["id"],
            "result": {
                "tools": [
                    {
                        "name": "demo",
                        "description": "Demo tool",
                        "inputSchema": {"type": "object"}
                    }
                ]
            }
        }), flush=True)
""".strip(),
        encoding="utf-8",
    )
    server = ServerConfig(name="fake", command=["python3", str(server_file)])

    tools = list_tools(server, timeout=2)

    assert len(tools) == 1
    assert tools[0].name == "demo"
    assert tools[0].description == "Demo tool"


def test_list_tools_reads_http_mcp_response(monkeypatch) -> None:
    requests = []

    class FakeResponse:
        def __init__(self, body: dict | None, headers: dict[str, str] | None = None) -> None:
            self.body = body
            self.headers = headers or {}

        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> None:
            return None

        def read(self) -> bytes:
            if self.body is None:
                return b""
            return json.dumps(self.body).encode("utf-8")

    def fake_urlopen(request, timeout: float, context=None):
        requests.append(request)
        message = json.loads(request.data.decode("utf-8"))
        if message.get("method") == "initialize":
            return FakeResponse(
                {
                    "jsonrpc": "2.0",
                    "id": message["id"],
                    "result": {"capabilities": {}, "serverInfo": {"name": "fake"}},
                },
                {"Mcp-Session-Id": "session-1"},
            )
        if message.get("method") == "notifications/initialized":
            return FakeResponse(None)
        if message.get("method") == "tools/list":
            return FakeResponse(
                {
                    "jsonrpc": "2.0",
                    "id": message["id"],
                    "result": {
                        "tools": [
                            {
                                "name": "remote_demo",
                                "description": "Remote demo",
                                "inputSchema": {"type": "object"},
                            }
                        ]
                    },
                }
            )
        raise AssertionError(f"unexpected method: {message.get('method')}")

    monkeypatch.setattr("mcp_hub.mcp_client.urlopen", fake_urlopen)
    server = ServerConfig(
        name="remote",
        transport="http",
        url="https://example.com/mcp",
        headers={"Authorization": "Bearer secret"},
    )

    tools = list_tools(server, timeout=2)

    assert len(tools) == 1
    assert tools[0].name == "remote_demo"
    assert tools[0].description == "Remote demo"
    assert [json.loads(request.data.decode("utf-8"))["method"] for request in requests] == [
        "initialize",
        "notifications/initialized",
        "tools/list",
    ]
    assert requests[0].headers["Authorization"] == "Bearer secret"
    assert requests[2].headers["Mcp-session-id"] == "session-1"


def test_run_http_stdio_proxy_forwards_json_rpc(monkeypatch) -> None:
    requests = []

    class FakeResponse:
        def __init__(self, body: dict | None, headers: dict[str, str] | None = None) -> None:
            self.body = body
            self.headers = headers or {}

        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> None:
            return None

        def read(self) -> bytes:
            if self.body is None:
                return b""
            return json.dumps(self.body).encode("utf-8")

    def fake_urlopen(request, timeout: float, context=None):
        requests.append(request)
        message = json.loads(request.data.decode("utf-8"))
        if message.get("method") == "initialize":
            return FakeResponse(
                {"jsonrpc": "2.0", "id": message["id"], "result": {"capabilities": {}}},
                {"Mcp-Session-Id": "session-1"},
            )
        if message.get("method") == "notifications/initialized":
            return FakeResponse(None)
        if message.get("method") == "tools/list":
            return FakeResponse(
                {
                    "jsonrpc": "2.0",
                    "id": message["id"],
                    "result": {"tools": [{"name": "remote_demo"}]},
                }
            )
        raise AssertionError(f"unexpected method: {message.get('method')}")

    monkeypatch.setattr("mcp_hub.mcp_client.urlopen", fake_urlopen)
    server = ServerConfig(
        name="remote",
        transport="http",
        url="https://example.com/mcp",
        headers={"Authorization": "Bearer secret"},
    )
    stdin = io.StringIO(
        "\n".join(
            [
                json.dumps({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}),
                json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}}),
                json.dumps({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}),
            ]
        )
        + "\n"
    )
    stdout = io.StringIO()

    run_http_stdio_proxy(server, stdin=stdin, stdout=stdout, timeout=2)

    responses = [json.loads(line) for line in stdout.getvalue().splitlines()]
    assert [response["id"] for response in responses] == [1, 2]
    assert responses[1]["result"]["tools"] == [{"name": "remote_demo"}]
    assert requests[2].headers["Mcp-session-id"] == "session-1"
