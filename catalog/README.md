# MCP Hub Catalog

This directory is the portable MCP source of truth.

Agents should use it like this:

1. Read `profiles.yaml` and choose the requested profile, usually `content`, `cursor`, `claude`, or `all`.
2. Read the referenced servers from `servers.yaml`.
3. Compare those servers with the agent's local MCP configuration.
4. Add missing servers in the local client format.
5. Keep `${MCP_HUB_SECRET_...}` placeholders as placeholders unless the user provides the matching secret.

Do not treat this catalog as a live status file for a specific agent. Each agent is responsible for checking its own local MCP config and installing the missing entries.
