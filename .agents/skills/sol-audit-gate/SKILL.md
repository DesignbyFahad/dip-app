---
name: sol-audit-gate
description: Install or update a mandatory pre-commit AI audit and context gate in the current repository. Use after the project-local installer has created `.sol-audit-gate.json`, or when asked to require Sol/OpenRouter review before commits.
---

# Sol Audit Gate

Read `.sol-audit-gate.json` first. It contains the project's approved, non-secret choices.

Before writing files, confirm the selected reviewer route can run. For `openrouter`, check only that `OPENROUTER_API_KEY` is set; never request, reveal, or persist the value. If absent, stop and give platform-appropriate setup instructions.

Install a fail-closed pre-commit gate that requires the configured context updates and a current structured reviewer PASS receipt bound to the staged diff and Git index tree. Review hooks, configuration, AGENTS.md, SVG, unknown types, symlinks, gitlinks, and all type changes. Exempt only regular Markdown and inert common image/PDF files if the profile permits it.

Add an audit command, local receipt storage under `.git`, tests for stale receipts and link/type-change bypasses, and clear daily workflow documentation. Use a Git-object snapshot rather than mutable working files. Respect the profile's threat model and state its limits exactly. Run tests and the configured reviewer audit before committing. Never use `--no-verify`.
