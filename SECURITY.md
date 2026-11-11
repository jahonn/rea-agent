# Security policy

## Supported versions

Security fixes are applied to the latest commit on the default branch while the project is below version 1.0.0.

## Report a vulnerability

Use GitHub's private security advisory process for `jahonn/rea-agent` when available. Do not open a public issue containing exploit details, credentials, proprietary application content, or confidential analysis output.

Include the affected version, operating system, reproduction steps using a synthetic fixture, expected behavior, and actual behavior.

## Scope and safety model

REA Agent does not execute REA analysis or runtime capture. Its CLI provides environment probes, installation, report initialization, and validation. The Agent Skill instructs a host to obtain authorization and use REA, but prompt instructions are not a technical sandbox.

Users remain responsible for:

- target ownership and authorization;
- legal use of commercial analysis providers;
- host sandbox and approval settings;
- reviewing files and commands before execution;
- isolating runtime capture in an appropriate environment;
- protecting credentials and sensitive model input.

Local REA analysis does not mean that results remain local. Evidence returned to an AI agent may be sent to the configured model provider under that provider's data policy.

## Installer safeguards

Installation is a dry run unless `--apply` is present. Existing paths are rejected before writing, and the installer does not modify MCP configuration or persistent `AGENTS.md` files. Use `--root` to review changes in a staging directory first.

## Validator limitations

The validator checks JSON structure and required fields. It does not verify signatures, ownership, artifact hashes against disk, evidence accuracy, or legal authorization. A valid report can still contain false claims. Human review and independent testing remain required.
