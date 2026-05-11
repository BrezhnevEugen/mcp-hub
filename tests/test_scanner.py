from mcp_hub.mcp_client import ToolInfo
from mcp_hub.scanner import compare_tools


def test_compare_tools_marks_first_scan() -> None:
    changes = compare_tools("demo", [ToolInfo("alpha"), ToolInfo("beta")], None)

    assert changes.first_scan is True
    assert changes.added == ["alpha", "beta"]
    assert changes.removed == []
    assert changes.changed is False


def test_compare_tools_detects_added_and_removed_tools() -> None:
    changes = compare_tools("demo", [ToolInfo("beta"), ToolInfo("gamma")], ["alpha", "beta"])

    assert changes.first_scan is False
    assert changes.current == ["beta", "gamma"]
    assert changes.added == ["gamma"]
    assert changes.removed == ["alpha"]
