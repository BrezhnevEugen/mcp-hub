from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from typing import Any

from .models import ServerConfig


@dataclass(frozen=True)
class ToolInfo:
    name: str
    description: str = ""
    input_schema: dict[str, Any] | None = None


class MCPError(RuntimeError):
    pass


def tools_to_mappings(tools: list[ToolInfo]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for tool in tools:
        item: dict[str, Any] = {"name": tool.name}
        if tool.description:
            item["description"] = tool.description
        if tool.input_schema:
            item["inputSchema"] = tool.input_schema
        result.append(item)
    return sorted(result, key=lambda item: item["name"])


def list_tools(server: ServerConfig, timeout: float = 10.0) -> list[ToolInfo]:
    if server.transport != "stdio":
        raise MCPError(f"unsupported transport: {server.transport}")

    env = os.environ.copy()
    env.update(server.env)
    process = subprocess.Popen(
        server.command,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
    )

    try:
        initialize = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "mcp-hub", "version": "0.1.0"},
            },
        }
        initialized = {"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}}
        tools_list = {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}

        assert process.stdin is not None
        process.stdin.write(json.dumps(initialize) + "\n")
        process.stdin.write(json.dumps(initialized) + "\n")
        process.stdin.write(json.dumps(tools_list) + "\n")
        process.stdin.flush()

        response = _read_response(process, expected_id=2, timeout=timeout)
        result = response.get("result", {})
        tools = result.get("tools", [])
        if not isinstance(tools, list):
            raise MCPError("tools/list returned an invalid tools payload")
        return [
            ToolInfo(
                name=str(tool.get("name", "")),
                description=str(tool.get("description", "")),
                input_schema=tool.get("inputSchema") if isinstance(tool.get("inputSchema"), dict) else None,
            )
            for tool in tools
            if isinstance(tool, dict) and tool.get("name")
        ]
    finally:
        process.terminate()
        try:
            process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            process.kill()


def _read_response(process: subprocess.Popen[str], expected_id: int, timeout: float) -> dict[str, Any]:
    import select
    import time

    assert process.stdout is not None
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        remaining = max(0.0, deadline - time.monotonic())
        readable, _, _ = select.select([process.stdout], [], [], min(0.1, remaining))
        if not readable:
            if process.poll() is not None:
                stderr = process.stderr.read() if process.stderr else ""
                raise MCPError(f"server exited before response: {stderr.strip()}")
            continue
        line = process.stdout.readline()
        if not line:
            if process.poll() is not None:
                stderr = process.stderr.read() if process.stderr else ""
                raise MCPError(f"server exited before response: {stderr.strip()}")
            time.sleep(0.05)
            continue
        try:
            message = json.loads(line)
        except json.JSONDecodeError:
            continue
        if message.get("id") != expected_id:
            continue
        if "error" in message:
            raise MCPError(str(message["error"]))
        return message
    raise MCPError(f"timed out waiting for response id={expected_id}")
