# Architecture

## Design goal

Provide a reusable investigation workflow without creating another agent runtime. Claude Code, Codex, dsh, and WorkBuddy already provide model invocation, planning, tools, permissions, and conversation state. REA Agent supplies only the portable behavior, adapters, and deterministic contracts that those runtimes do not share.

## Components

### Agent Skill

`skills/rea-agent/SKILL.md` is the behavioral source of truth. It defines authorization, environment setup, target classification, least-invasive tool selection, evidence interpretation, optional rebuilding, and the output contract.

References and templates use progressive disclosure so a host can load detailed instructions only when needed.

### Host adapters

Claude Code has a named subagent definition with an isolated context and a preloaded skill. Codex and dsh consume the shared skill directly and can optionally merge instruction snippets into persistent guidance. WorkBuddy consumes the same skill through its user or project skill directory.

Adapters contain no analysis logic. This prevents behavior from diverging across hosts.

### CLI

The CLI is divided into small ES modules:

- `version.mjs`: runtime comparison and current REA Node.js compatibility.
- `doctor.mjs`: side-effect-free executable probes and actionable recommendations.
- `install.mjs`: pure install planning followed by conflict-checked file operations.
- `validate.mjs`: structural validation and strict authorization checks.
- `cli.mjs`: argument parsing, output, and exit statuses.

The package exports these modules for consumers that want to integrate the behavior without spawning the CLI.

### Investigation contract

The JSON Schema documents the portable report format. The validator mirrors its required constraints and adds a strict mode for confirmed authorization. Findings require at least one evidence item and an explicit confidence label.

## Trust boundaries

```text
User authorization
    |
    v
Agent host permissions
    |
    v
REA Agent workflow --------> does not execute analysis
    |
    v
Official REA MCP / CLI
    |
    v
Target and analysis providers
    |
    v
Evidence returned to the host and model provider
```

A prompt-based gate is not a security boundary. Host sandboxing, operating-system permissions, target licensing, and user review remain necessary. The authorization fields record declarations; they do not authenticate the user or prove ownership.

## Installer invariants

1. Planning performs no writes.
2. `--apply` is required for changes.
3. All destinations are checked before the first write.
4. Existing destinations stop the operation.
5. Existing `AGENTS.md` and MCP files are never modified.
6. Codex and dsh shared destinations are deduplicated.
7. `--root` supports isolated staging and automated tests.

A failed copy can still leave a partial new installation if the operating system fails after preflight. Users should install into a staging root for controlled deployments. Non-destructive update and rollback support is on the roadmap.

## Why zero dependencies

The CLI uses Node.js built-ins for filesystem, process, path, and test operations. This makes behavior easier to inspect, minimizes install time, and avoids adding third-party dependencies to a security-sensitive workflow. The trade-off is that schema validation implements only the documented contract rather than the full JSON Schema specification.

## Testing strategy

- Unit tests cover version compatibility, report validation, and environment diagnostics.
- Filesystem tests use unique temporary directories and verify dry-run and no-overwrite behavior.
- CLI tests spawn the real executable and verify exit statuses and generated records.
- CI runs the same suite on supported Node.js release lines.

Tests use synthetic fixtures and never inspect proprietary software or invoke REA analysis.
