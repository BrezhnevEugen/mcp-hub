from __future__ import annotations

import argparse
import json
from pathlib import Path
import shlex
import sys

from .config import HubConfig
from .mcp_client import MCPError, list_tools
from .models import ServerConfig
from .scanner import compare_tools


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="mcp-hub", description="Manage personal MCP servers.")
    parser.add_argument("--home", help="Config directory. Defaults to ~/.mcp-hub or MCP_HUB_HOME.")
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    subparsers.add_parser("init", help="Create config files.")

    add_parser = subparsers.add_parser("add", help="Add or update an MCP server.")
    add_parser.add_argument("name")
    add_parser.add_argument("--command", dest="server_command", required=True, help="Command used to start the MCP server.")
    add_parser.add_argument("--tag", action="append", default=[], help="Tag to attach to the server.")
    add_parser.add_argument("--description", default="")

    subparsers.add_parser("list", help="List registered servers.")

    inspect_parser = subparsers.add_parser("inspect", help="Run tools/list against a server.")
    inspect_parser.add_argument("name")
    inspect_parser.add_argument("--json", action="store_true", help="Print raw JSON.")

    status_parser = subparsers.add_parser("status", help="Check registered servers.")
    status_parser.add_argument("--profile", help="Only check servers in a profile.")

    scan_parser = subparsers.add_parser("scan", help="Check tools and diff them against the previous snapshot.")
    scan_parser.add_argument("--profile", help="Only scan servers in a profile.")
    scan_parser.add_argument("--json", action="store_true", help="Print JSON result.")

    profile_parser = subparsers.add_parser("profile", help="Create or update a profile.")
    profile_parser.add_argument("name")
    profile_parser.add_argument("servers", nargs="*")

    export_parser = subparsers.add_parser("export", help="Export MCP config for a client.")
    export_parser.add_argument("client", choices=["codex", "claude-desktop"])
    export_parser.add_argument("--profile", default="default")

    args = parser.parse_args(argv)
    hub = HubConfig() if args.home is None else HubConfig(config_dir=Path(args.home).expanduser())

    try:
        return _dispatch(args, hub)
    except (MCPError, ValueError, FileNotFoundError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


def _dispatch(args: argparse.Namespace, hub: HubConfig) -> int:
    if args.subcommand == "init":
        hub.init()
        print(f"initialized {hub.config_dir}")
        return 0

    if args.subcommand == "add":
        hub.init()
        servers = hub.load_servers()
        servers[args.name] = ServerConfig(
            name=args.name,
            command=shlex.split(args.server_command),
            tags=args.tag,
            description=args.description,
        )
        hub.save_servers(servers)
        print(f"added {args.name}")
        return 0

    if args.subcommand == "list":
        servers = hub.load_servers()
        if not servers:
            print("no servers registered")
            return 0
        for server in servers.values():
            tags = f" [{', '.join(server.tags)}]" if server.tags else ""
            state = "enabled" if server.enabled else "disabled"
            print(f"{server.name}\t{state}\t{server.transport}\t{shlex.join(server.command)}{tags}")
        return 0

    if args.subcommand == "inspect":
        server = _get_server(hub, args.name)
        tools = list_tools(server)
        if args.json:
            print(json.dumps([tool.__dict__ for tool in tools], indent=2, ensure_ascii=False))
        else:
            print(f"{server.name}: {len(tools)} tool(s)")
            for tool in tools:
                suffix = f" - {tool.description}" if tool.description else ""
                print(f"  {tool.name}{suffix}")
        return 0

    if args.subcommand == "status":
        servers = _servers_for_status(hub, args.profile)
        for server in servers:
            try:
                tools = list_tools(server, timeout=5)
            except Exception as exc:
                print(f"{server.name}\tbroken\t{exc}")
            else:
                print(f"{server.name}\tok\t{len(tools)} tool(s)")
        return 0

    if args.subcommand == "scan":
        results = _scan_tools(hub, args.profile)
        if args.json:
            print(json.dumps(results, indent=2, ensure_ascii=False))
        else:
            _print_scan_results(results)
        return 2 if any(item.get("changed") for item in results) else 0

    if args.subcommand == "profile":
        profiles = hub.load_profiles()
        known = set(hub.load_servers())
        missing = sorted(set(args.servers) - known)
        if missing:
            raise ValueError(f"unknown server(s): {', '.join(missing)}")
        profiles[args.name] = args.servers
        hub.save_profiles(profiles)
        print(f"profile {args.name}: {', '.join(args.servers) if args.servers else '(empty)'}")
        return 0

    if args.subcommand == "export":
        payload = _export_config(hub, args.profile)
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return 0

    raise ValueError(f"unknown command: {args.subcommand}")


def _get_server(hub: HubConfig, name: str) -> ServerConfig:
    servers = hub.load_servers()
    try:
        return servers[name]
    except KeyError as exc:
        raise ValueError(f"unknown server: {name}") from exc


def _servers_for_status(hub: HubConfig, profile: str | None) -> list[ServerConfig]:
    servers = hub.load_servers()
    if profile is None:
        return list(servers.values())
    profiles = hub.load_profiles()
    if profile not in profiles:
        raise ValueError(f"unknown profile: {profile}")
    return [servers[name] for name in profiles[profile] if name in servers]


def _export_config(hub: HubConfig, profile: str) -> dict[str, object]:
    servers = hub.load_servers()
    profiles = hub.load_profiles()
    if profile not in profiles:
        raise ValueError(f"unknown profile: {profile}")

    selected = {name: servers[name] for name in profiles[profile] if name in servers and servers[name].enabled}
    return {
        "mcpServers": {
            name: {
                "command": server.command[0],
                "args": server.command[1:],
                **({"env": server.env} if server.env else {}),
            }
            for name, server in selected.items()
        }
    }


def _scan_tools(hub: HubConfig, profile: str | None) -> list[dict[str, object]]:
    servers = _servers_for_status(hub, profile)
    snapshots = hub.load_tool_snapshots()
    results: list[dict[str, object]] = []

    for server in servers:
        try:
            tools = list_tools(server, timeout=5)
        except Exception as exc:
            results.append({"server": server.name, "status": "broken", "error": str(exc), "changed": False})
            continue

        previous = snapshots.get(server.name)
        changes = compare_tools(server.name, tools, previous)
        snapshots[server.name] = changes.current
        results.append(
            {
                "server": server.name,
                "status": "ok",
                "tool_count": len(changes.current),
                "first_scan": changes.first_scan,
                "changed": changes.changed,
                "added": changes.added,
                "removed": changes.removed,
            }
        )

    hub.save_tool_snapshots(snapshots)
    return results


def _print_scan_results(results: list[dict[str, object]]) -> None:
    for item in results:
        server = item["server"]
        if item["status"] != "ok":
            print(f"{server}\tbroken\t{item['error']}")
            continue
        if item["first_scan"]:
            print(f"{server}\tbaseline\t{item['tool_count']} tool(s)")
            continue
        if not item["changed"]:
            print(f"{server}\tunchanged\t{item['tool_count']} tool(s)")
            continue

        print(f"{server}\tchanged\t{item['tool_count']} tool(s)")
        for name in item["added"]:
            print(f"  + {name}")
        for name in item["removed"]:
            print(f"  - {name}")


if __name__ == "__main__":
    raise SystemExit(main())
