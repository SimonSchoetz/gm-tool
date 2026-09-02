# `.claude/` — what lives here and what doesn't

This directory used to hold a full agent workflow: specialist agent personas, slash commands, a knowledge cache, and per-cycle handoff artifacts. Most of that has moved out to a personal, machine-wide setup repository so it can be reused across projects. What remains here is the part that is genuinely specific to *this* repository.

If you have taken this project over from someone else: **the workflow tooling is not part of the handover.** It lived on the previous maintainer's machine, not in this repo, and nothing here depends on it to build, test, or run the app. You can ignore this directory entirely and the project still works. The notes below exist so the leftovers don't look like something broken or half-deleted.

## What's here

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | Points at where the workflow definitions live and describes the one piece of infrastructure that stays in-repo. Short by design. |
| `spec-writer-gate-extensions.md` | A checklist of this project's own React/Tauri conventions, used by a spec-authoring workflow. Read on demand rather than loaded automatically — it is long and only one role consumes it. |
| `cycles/` | Scratch space where separate AI sessions hand work off to each other. **Gitignored**, machine-local, and safe to delete at any time. If you see it, it is working as intended. |
| `settings.local.json` | Personal tool-permission settings. Gitignored. |
| `launch.json` | Dev-server config for the in-editor browser preview. |

## What's deliberately *not* here

Agent definitions, slash commands, skills, and shared reference material are supplied by a plugin from an external setup repository, shared across every project on that machine. They are intentionally absent from this repo — not missing, not deleted by accident.

The same is true of the verified-external-facts cache (library APIs, CLI flags, config formats) and the workflow's own execution log. Both are keyed to this project by an `artifact-key` slug declared in the root `CLAUDE.md`.

## Where the project's own conventions live

Coding conventions, architectural rules, and the toolchain itself are **not** in this directory. They live in the auto-loaded `CLAUDE.md` files, which any AI assistant reads automatically and any human can read directly:

- Root `CLAUDE.md` — git conventions, code style, the check-command table (type-check, lint, format, test, and the Rust suite), the build command, and the package manager
- `app/CLAUDE.md` — TypeScript conventions shared across the frontend, services, and domain layers
- `app/*/CLAUDE.md` — per-layer rules for `db/`, `docs/`, `domain/`, `services/`, `src/`, and `src-tauri/`

That placement is deliberate: anything every contributor needs by default belongs somewhere it is read by default, not behind an explicit instruction to go look for it.

## Migration status

The move described above is partly done. Still outstanding:

1. `knowledge/` still contains its cached fact files, though the rules now point at the external store. They need moving, after which the directory can go.
2. `agents/`, `commands/`, `reference/`, and `retro-log.md` are still present and still functional, but are slated to move to the plugin.
3. The external setup repository needs its own instruction files written — several references here point at them.

Until those land, some rules point at a destination that isn't populated yet. Nothing in the application code is affected.
