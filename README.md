# MCP Hub

Personal registry and operations CLI for MCP servers.

MCP Hub keeps a local catalog of MCP servers, groups them into access profiles, checks whether they respond to `tools/list`, and exports client config for agents.

## MVP scope

- Register stdio MCP servers.
- Store server metadata in `registry.yaml`.
- Store access profiles in `profiles.yaml`.
- Inspect a server by starting it and calling `tools/list`.
- Export `mcpServers` JSON for Codex-compatible and Claude Desktop-compatible clients.

## Install for development

```bash
python3 -m venv .venv
.venv/bin/pip install -e ".[test]"
```

If you do not want test extras yet:

```bash
.venv/bin/pip install -e .
```

## Quick start

```bash
mcp-hub init
mcp-hub add yt-sub --command "python3 -m yt_sub.server" --tag media --tag transcript
mcp-hub list
mcp-hub inspect yt-sub
mcp-hub scan --profile content
mcp-hub profile content yt-sub
mcp-hub export codex --profile content
```

Config defaults to `~/.mcp-hub`. For isolated testing, use:

```bash
mcp-hub --home .mcp-hub init
```

## Config files

`registry.yaml`:

```yaml
servers:
  yt-sub:
    transport: stdio
    command:
      - python3
      - -m
      - yt_sub.server
    enabled: true
    tags:
      - media
      - transcript
```

`profiles.yaml`:

```yaml
profiles:
  content:
    servers:
      - yt-sub
```

## Roadmap

- Add `remove`, `disable`, and `enable` commands.
- Add environment variable management and secret references.
- Add audit logs for inspect/status/export.
- Add a local dashboard.
- Add remote deployment helpers for sensitive infrastructure MCP servers.

## Periodic capability checks

`mcp-hub scan` stores the last known tool names in `tool-snapshots.yaml` and reports changes on the next run:

```bash
mcp-hub scan --profile content
```

Exit code `2` means at least one server changed its tool list. Exit code `0` means no changes were detected.
