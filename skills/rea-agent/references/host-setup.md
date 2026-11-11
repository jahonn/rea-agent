# Host setup

## Official REA toolchain

Install and register REA through its official installer:

```bash
npx rea-agents setup
```

Review every proposed change and restart the host afterward. REA is a separate MIT-licensed project maintained at https://github.com/morluto/rea. This repository does not vendor REA or replace its installer.

Current REA releases document these Node.js runtime baselines:

- Node.js 22.23.4 or newer in the 22.x line
- Node.js 24.22.1 or newer in the 24.x line
- Node.js 26.12.1 or newer

Run `rea-agent doctor` to inspect local readiness without downloading REA.

## Portable skill paths

| Host | Project scope | User scope |
|---|---|---|
| Claude Code | `.claude/skills/rea-agent/` | `~/.claude/skills/rea-agent/` |
| Codex | `.agents/skills/rea-agent/` | `~/.agents/skills/rea-agent/` |
| dsh | `.agents/skills/rea-agent/` | `~/.agents/skills/rea-agent/` |
| WorkBuddy | `.workbuddy/skills/rea-agent/` | `~/.workbuddy/skills/rea-agent/` |

Claude Code also receives `.claude/agents/rea-agent.md` for isolated subagent execution.

The installer defaults to a dry run:

```bash
rea-agent install --target claude --scope user
rea-agent install --target claude --scope user --apply
```

Use `--root <directory>` to stage files under a temporary directory. Existing destinations are never overwritten.

## Optional persistent guidance

Codex users can merge `adapters/codex/AGENTS.snippet.md` into an appropriate `AGENTS.md`. dsh users can adapt `adapters/dsh/AGENTS.snippet.md`. These snippets are not installed or merged automatically because existing agent instructions must not be overwritten.
