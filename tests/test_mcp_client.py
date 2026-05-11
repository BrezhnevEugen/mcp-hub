from pathlib import Path

from mcp_hub.mcp_client import list_tools
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
