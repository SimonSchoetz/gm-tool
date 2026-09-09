# devloop

This file is this project's declaration for the `devloop` Claude Code plugin — spec-driven workflow tooling that is not part of this repository: it is installed per machine as the symlink `~/.claude/skills/devloop` into a checkout of `git@github.com:SimonSchoetz/setup.git` (directory `claude/devloop/` of that repository). The plugin's skills read this file on demand, one `##` entry at a time, looked up by heading name; nothing here is auto-loaded, and this is the only file through which the project speaks to the plugin — `.claude/README.md` names it in prose for a human reader, and nothing else in this repository depends on it. Each entry holds a project fact or one pointer (`<path> — <heading>`) into this repository's own files. Without the plugin this file has no reader, and every command, path, and convention it names is still true of the project on its own.

## checks

`CLAUDE.md — Tool Use Discipline`

## build

`CLAUDE.md — Build Command`

## dependency-manifests

| Manifest | Lockfile | Regenerate lockfile with |
| --- | --- | --- |
| `app/package.json` | `app/pnpm-lock.yaml` | `pnpm install`, from `app/` |
| `package.json` | `pnpm-lock.yaml` | `pnpm install`, from the repo root |
| `app/src-tauri/Cargo.toml` | `app/src-tauri/Cargo.lock` | `cargo check`, from `app/src-tauri/` |

`app/src-tauri/vendor/*/Cargo.toml` are vendored crates, not project manifests.

## compiler-config

- `app/tsconfig.json`

## linter-config

- `app/eslint.config.js`

## layer-order

`app/docs/CLAUDE.md — Layered breakdown`

## layers

| Layer | Root | Conventions | Role |
| --- | --- | --- | --- |
| Database | `app/db/` | `app/db/CLAUDE.md` | db |
| Domain | `app/domain/` | `app/domain/CLAUDE.md` | domain |
| Services | `app/services/` | `app/services/CLAUDE.md` | service |
| Data Access Layer | `app/src/data-access-layer/` | `app/src/CLAUDE.md` | data-access |
| Frontend | `app/src/` | `app/src/CLAUDE.md` | ui |
| Rust backend | `app/src-tauri/` | `app/src-tauri/CLAUDE.md` | backend |

## spec-directory

`app/docs/`

## spec-format-extension

`app/docs/CLAUDE.md — Spec Format Extension`

## testing-policy

`app/src/CLAUDE.md — Testing Policy`

## long-living-references

- `app/docs/_product/domain-scaffold.md`

## advisory-scans

| Scan | Files | Report | Exempt when | Disposition | Convention |
| --- | --- | --- | --- | --- | --- |
| Raw CSS values | `app/src/**/*.css` | raw property values (colors, spacing, border radii, shadows, font sizes) instead of a design token | `/* one-off */` on the same line or the line immediately preceding | add a design token, add `/* one-off */`, or leave as-is | `app/src/CLAUDE.md — Styles` |

## citation-format

`CLAUDE.md — Citations`

## library-lookup

`app/CLAUDE.md — Third-Party Libraries`
