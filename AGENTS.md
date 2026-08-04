# DIP application instructions

Read `CONTEXT.md` and `PROGRESS.md` before changing this repository.

## Model routing

- `[CODE]` / `@kimi`: routine implementation, tests, and refactors through OpenRouter (`moonshotai/kimi-k3`). Requires `OPENROUTER_API_KEY` to be present in the environment; never store the value in the repository.
- `[L2]` / `@terra`: ordinary product and planning work.
- `[L3]` / `@sol`: architecture decisions, security-sensitive work, and final review.

Prompt prefixes guide CLI routing; they do not change the model selected in an already-open Codex desktop task.

## Commit rule

For every non-document commit, stage updates to `CONTEXT.md` and `PROGRESS.md`, run `python scripts/sol_audit.py`, and do not commit unless it reports PASS for the current staged diff. Run `python scripts/setup_git_hooks.py` after cloning. The local snapshot audit is a practical enforcement boundary; it does not protect against a fully compromised local machine.
