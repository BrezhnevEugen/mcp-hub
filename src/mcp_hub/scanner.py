from __future__ import annotations

from dataclasses import dataclass

from .mcp_client import ToolInfo


@dataclass(frozen=True)
class ToolChangeSet:
    server_name: str
    current: list[str]
    added: list[str]
    removed: list[str]
    first_scan: bool = False

    @property
    def changed(self) -> bool:
        return not self.first_scan and bool(self.added or self.removed)


def compare_tools(server_name: str, current_tools: list[ToolInfo], previous_names: list[str] | None) -> ToolChangeSet:
    current = sorted({tool.name for tool in current_tools})
    previous = sorted(set(previous_names or []))
    previous_set = set(previous)
    current_set = set(current)
    return ToolChangeSet(
        server_name=server_name,
        current=current,
        added=sorted(current_set - previous_set),
        removed=sorted(previous_set - current_set),
        first_scan=previous_names is None,
    )
