# Release Pipeline Architecture

This document covers the CI/CD architecture for multi-platform, multi-channel releases. For the manual steps to cut a release (version bump, changelog, tagging), see `release-process.md`.

## Channel model

Stable and beta are **two separate Tauri apps with different identifiers**. They are not the same binary with a flag — they are independent installations.

This is required because the Tauri data directory is scoped to the app identifier. If both channels shared an identifier, they would share `%APPDATA%\{identifier}\` on Windows, including the SQLite database. A beta schema migration would then run against the stable database. There is no rollback mechanism, so this is unrecoverable.

With different identifiers:

- Separate install paths
- Separate data directories
- Separate SQLite databases
- Separate auto-updater endpoint (compiled into each binary at build time)
- Both can be installed on the same machine simultaneously

Data entered in beta is not visible in stable and vice versa. This is a known, accepted constraint.

| | Stable | Beta |
|---|---|---|
| Tauri identifier | `com.gmtool.app` (or existing value) | `com.gmtool.app.beta` |
| App name | GM Tool | GM Tool Beta |
| GitHub release type | Release | Prerelease |
| Auto-updater endpoint | stable releases endpoint | prerelease releases endpoint |

## Tag naming convention

All tags are pushed on `main`. There is no `stable-release` or `beta` long-running branch.

- `v1.0.0` → triggers stable release build
- `v1.0.0-beta.1` → triggers beta release build

Stability is determined entirely by the tag name, not the branch. The existing "Verify tag is on main" CI step in `release.yml` enforces that stable tags are only ever cut from `main`.

## Tauri configuration

Two `tauri.conf.json` files:

- `app/src-tauri/tauri.conf.json` — existing file, used for stable builds, unchanged
- `app/src-tauri/tauri.beta.conf.json` — beta overrides: `identifier`, `productName`, and updater endpoint

The beta workflow passes `tauri.beta.conf.json` to `tauri-apps/tauri-action` via its `configPath` input. The stable workflow uses the default config path (no override needed).

`tauri.beta.conf.json` must override at minimum:

- `identifier` → `com.gmtool.app.beta`
- `productName` → `GM Tool Beta`
- `plugins.updater.endpoints` → beta-channel endpoint URL

## GitHub Actions workflow structure

Two workflow files, not six:

```text
.github/workflows/
  release.yml           # triggers on v[0-9]+.[0-9]+.[0-9]+ tags (no pre-release suffix)
  beta-release.yml      # triggers on v*-beta* tags
```

Each file uses a `matrix` strategy across 2 platforms:

```yaml
strategy:
  matrix:
    os: [windows-latest, macos-latest]
```

`tauri-apps/tauri-action` detects the runner OS and builds the platform-appropriate artifact automatically. No platform-specific branching in the job steps is needed.

Channel-specific parameters (config path, `prerelease` flag, release name prefix) are job-level values set once per workflow file, not per matrix entry.

### Trigger patterns

`release.yml`:

```yaml
on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'
```

`beta-release.yml`:

```yaml
on:
  push:
    tags:
      - 'v*-beta*'
```

### Key differences between the two workflow files

| | `release.yml` | `beta-release.yml` |
|---|---|---|
| Trigger tag pattern | `v1.2.3` (no suffix) | `v1.2.3-beta.N` |
| `prerelease` flag in tauri-action | `false` | `true` |
| `configPath` in tauri-action | omitted (uses default) | `app/src-tauri/tauri.beta.conf.json` |
| "Verify tag is on main" step | present | absent (beta tags also live on main, but the pattern already constrains the trigger) |

Shared setup steps (checkout, Node, Rust toolchain, `npm install`) are identical in both files. When updating these (e.g. Node version), both files must be updated.
