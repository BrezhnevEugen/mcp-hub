from __future__ import annotations

import json
import os
import ssl
import subprocess
import sys
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .models import ServerConfig

try:
    import certifi
except ImportError:  # pragma: no cover - fallback for minimal environments
    certifi = None


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
    if server.transport == "stdio":
        return _list_stdio_tools(server, timeout)
    if server.transport == "http":
        return _list_http_tools(server, timeout)
    raise MCPError(f"unsupported transport: {server.transport}")


def _list_stdio_tools(server: ServerConfig, timeout: float) -> list[ToolInfo]:
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


def _list_http_tools(server: ServerConfig, timeout: float) -> list[ToolInfo]:
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

    _, session_id = _post_json_rpc(server, initialize, timeout, expected_id=1)
    _post_json_rpc(server, initialized, timeout, session_id=session_id)
    response, _ = _post_json_rpc(server, tools_list, timeout, expected_id=2, session_id=session_id)
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


def _post_json_rpc(
    server: ServerConfig,
    message: dict[str, Any],
    timeout: float,
    expected_id: object | None = None,
    session_id: str | None = None,
) -> tuple[dict[str, Any], str | None]:
    headers = {
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json",
        **server.headers,
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id
    request = Request(
        server.url,
        data=json.dumps(message).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urlopen(request, timeout=timeout, context=_ssl_context()) as response:
            body = response.read().decode("utf-8")
            response_headers = response.headers
            session = response_headers.get("Mcp-Session-Id") or session_id
            if not body.strip() and expected_id is None:
                return {}, session
            return _parse_http_json_rpc(body, expected_id), session
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace").strip()
        raise MCPError(f"HTTP {exc.code}: {detail or exc.reason}") from exc
    except URLError as exc:
        raise MCPError(str(exc.reason)) from exc


def run_http_stdio_proxy(
    server: ServerConfig,
    stdin: Any = None,
    stdout: Any = None,
    timeout: float = 60.0,
) -> None:
    if server.transport != "http":
        raise MCPError(f"proxy only supports http transport: {server.transport}")
    input_stream = stdin or sys.stdin
    output_stream = stdout or sys.stdout
    session_id: str | None = None
    for line in input_stream:
        if not line.strip():
            continue
        try:
            message = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(message, dict):
            continue
        expected_id = message.get("id") if "id" in message else None
        try:
            response, session_id = _post_json_rpc(
                server,
                message,
                timeout,
                expected_id=expected_id if isinstance(expected_id, (int, str)) else None,
                session_id=session_id,
            )
        except Exception as exc:
            if expected_id is not None:
                _write_json_rpc(output_stream, _error_response(expected_id, str(exc)))
            continue
        if expected_id is not None:
            _write_json_rpc(output_stream, response)


def _write_json_rpc(output_stream: Any, message: dict[str, Any]) -> None:
    output_stream.write(json.dumps(message, ensure_ascii=False) + "\n")
    output_stream.flush()


def _error_response(message_id: object, message: str) -> dict[str, Any]:
    return {
        "jsonrpc": "2.0",
        "id": message_id,
        "error": {"code": -32000, "message": message},
    }


def _parse_http_json_rpc(body: str, expected_id: object | None) -> dict[str, Any]:
    messages = _json_rpc_messages(body)
    if expected_id is not None:
        messages = [message for message in messages if message.get("id") == expected_id]
    if not messages:
        raise MCPError("remote server returned no matching JSON-RPC response")
    message = messages[-1]
    if "error" in message:
        raise MCPError(str(message["error"]))
    return message


def _ssl_context() -> ssl.SSLContext | None:
    if certifi is None:
        return None
    return ssl.create_default_context(cafile=certifi.where())


def _json_rpc_messages(body: str) -> list[dict[str, Any]]:
    text = body.strip()
    if not text:
        return []
    if text.startswith("event:") or text.startswith("data:") or "\ndata:" in text:
        messages: list[dict[str, Any]] = []
        for item in _sse_data_items(text):
            try:
                parsed = json.loads(item)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                messages.append(parsed)
            elif isinstance(parsed, list):
                messages.extend(message for message in parsed if isinstance(message, dict))
        return messages
    parsed = json.loads(text)
    if isinstance(parsed, dict):
        return [parsed]
    if isinstance(parsed, list):
        return [item for item in parsed if isinstance(item, dict)]
    raise MCPError("remote server returned an invalid JSON-RPC payload")


def _sse_data_items(text: str) -> list[str]:
    items: list[str] = []
    current: list[str] = []
    for line in text.splitlines():
        if not line.strip():
            if current:
                items.append("\n".join(current))
                current = []
            continue
        if line.startswith("data:"):
            current.append(line.removeprefix("data:").strip())
    if current:
        items.append("\n".join(current))
    return items
