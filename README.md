# MCP Hub

Personal registry and operations CLI for MCP servers.

MCP Hub keeps a local catalog of MCP servers, stores their discovered tools/actions, groups servers into access profiles, checks whether they respond to `tools/list`, and serves client config to agents on request.

## MVP scope

- Register stdio MCP servers.
- Store server metadata and discovered actions in `registry.yaml`.
- Store access profiles in `profiles.yaml`.
- Inspect a server by starting it and calling `tools/list`.
- Serve `mcpServers` JSON for Codex, Claude Desktop, and Cursor-compatible clients.
- Run a local visual interface for adding, deleting, importing, serving profile config, and toggling MCP servers.

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
mcp-hub show yt-sub
mcp-hub inspect yt-sub
mcp-hub profile content yt-sub
mcp-hub scan --profile content
mcp-hub config codex --profile content
mcp-hub ui
```

Sync existing Codex MCP servers into the local catalog:

```bash
mcp-hub import codex
```

Sync existing Claude Desktop MCP servers into the local catalog:

```bash
mcp-hub import claude-desktop
```

Sync existing Cursor MCP servers into the local catalog:

```bash
mcp-hub import cursor
```

Sync a project-level Cursor MCP file:

```bash
mcp-hub import cursor --path /path/to/project/.cursor/mcp.json
```

Open the local visual interface:

```bash
mcp-hub ui
```

Temporarily disable a server without deleting it:

```bash
mcp-hub disable yt-sub
mcp-hub enable yt-sub
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
    tools:
      - name: transcript
        description: Read YouTube subtitles and transcripts.
```

`profiles.yaml`:

```yaml
profiles:
  content:
    servers:
      - yt-sub
```

## Roadmap

- Add environment variable management and secret references.
- Add audit logs for inspect/status/config requests.
- Add remote deployment helpers for sensitive infrastructure MCP servers.

## Periodic capability checks

`mcp-hub inspect` and `mcp-hub scan` store the current tool/action metadata on each server entry in `registry.yaml`. `mcp-hub scan` also stores the last known tool names in `tool-snapshots.yaml` and reports changes on the next run:

```bash
mcp-hub scan --profile content
```

Exit code `2` means at least one server changed its tool list. Exit code `0` means no changes were detected.
