# `.claude/` — what lives here and what doesn't

This directory used to hold a full agent workflow: specialist agent personas, slash commands, and per-cycle handoff artifacts. Most of that has moved out to a personal, machine-wide setup repository so it can be reused across projects. What remains here is the part that is genuinely specific to *this* repository.

If you have taken this project over from someone else: **the workflow tooling is not part of the handover.** It lived on the previous maintainer's machine, not in this repo, and nothing here depends on it to build, test, or run the app. You can ignore this directory entirely and the project still works. The notes below exist so the leftovers don't look like something broken or half-deleted.

## What's here

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | Defines the `cut-release` local skill and points at root `CLAUDE.md` for the project-wide facts. Short by design. |
| `knowledge/` | Verified facts about this project's third-party libraries and tools — APIs, CLI flags, config formats — one file per system, each entry stamped with the version it was checked against. Tracked, and useful to any assistant or human working here; root `CLAUDE.md` says how entries are read and written. |
| `cycles/` | Scratch space where separate AI sessions hand work off to each other. Excluded from git locally (`.git/info/exclude`), machine-local, and safe to delete at any time. If you see it, it is working as intended. |
| `devloop.md` | The one file that declares this project to the Claude Code plugin that runs its spec-driven workflow; it explains itself and says where the plugin comes from. |
| `settings.local.json` | Personal tool-permission settings. Gitignored. |
| `launch.json` | Dev-server config for the in-editor browser preview. |

## What's deliberately *not* here

Agent definitions, slash commands, skills, and shared reference material are supplied by a Claude Code plugin installed per machine — `devloop.md` in this directory is the one file that declares this project to it. They are intentionally absent from this repo — not missing, not deleted by accident.

## Where the project's own conventions live

Coding conventions, architectural rules, and the toolchain itself are **not** in this directory. They live in the auto-loaded `CLAUDE.md` files, which any AI assistant reads automatically and any human can read directly:

- Root `CLAUDE.md` — git conventions, code style, the check-command table (type-check, lint, format, test, and the Rust suite), the build command, and the package manager
- `app/CLAUDE.md` — TypeScript conventions shared across the frontend, services, and domain layers
- `app/*/CLAUDE.md` — per-layer rules for `db/`, `docs/`, `domain/`, `services/`, `src/`, and `src-tauri/`

That placement is deliberate: anything every contributor needs by default belongs somewhere it is read by default, not behind an explicit instruction to go look for it.
