# SF5: GitHub Actions + Release Infrastructure

Creates the GitHub Actions release pipeline, the initial `CHANGELOG.md`, and the release process
documentation. Requires manual one-time setup steps (keypair generation, GitHub secrets) that
the implementing instance cannot perform — these are listed in the Manual Setup Brief at the end
of this file.

## Files Affected

```
New:
  .github/workflows/release.yml
  CHANGELOG.md
  app/docs/release-process.md
```

## GitHub Actions Workflow

### `.github/workflows/release.yml`

Triggered on `v*` tag push. Builds, signs, and publishes a Windows release via `tauri-action`.

The implementing instance must verify the exact `tauri-apps/tauri-action` input parameter names
and the `projectPath` option from the action's documentation before finalising — the parameters
below reflect the conventional form but may differ in the installed version.

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    permissions:
      contents: write
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - uses: dtolnay/rust-toolchain@stable

      - name: Install frontend dependencies
        run: npm install
        working-directory: app

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: GM Tool ${{ github.ref_name }}
          releaseDraft: false
          prerelease: false
          projectPath: app
```

## CHANGELOG.md

Place at the repository root (alongside `app/`).

```markdown
# Changelog

All notable changes to GM Tool are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [v0.1.0] - REPLACE_WITH_RELEASE_DATE
### Added
- Initial release
```

## Release Process Documentation

### `app/docs/release-process.md`

```markdown
# Release Process

## Before releasing

1. **Update the version** in two places:
   - `app/src-tauri/tauri.conf.json` → `"version"` field
   - `app/src-tauri/Cargo.toml` → `[package] version` field
   Both must match. Use semver: `MAJOR.MINOR.PATCH`.

   > **v0.1.0 only:** Both files already contain `0.1.0`. Skip this step for the first release.

2. **Update CHANGELOG.md** (ask Claude to do this):
   - Move all entries under `[Unreleased]` to a new versioned section:
     `## [v1.2.3] - YYYY-MM-DD`
   - Add a new empty `## [Unreleased]` section above it
   - Classify entries by conventional commit type:
     - `feat` commits → `### Added`
     - `fix` commits → `### Fixed`
     - `refactor`, `perf` commits → `### Changed`
     - `chore` commits with user-visible effect → `### Changed`
     - Internal-only `chore`, `docs`, `test`, `style` commits → omit

3. **Commit the version bump and changelog update:**
   ```
   chore(release): bump version to v1.2.3
   ```

## Cutting the release

Push a version tag matching the version in `tauri.conf.json`:

```bash
git tag v1.2.3
git push origin v1.2.3
```

The GitHub Actions workflow triggers automatically, builds the installer,
signs it, and publishes a GitHub Release with the update manifest.

## First release only: keypair setup

See the Manual Setup Brief — this is a one-time step performed before the
first release tag is pushed.
```

---

## Manual Setup Brief

These steps are performed by the developer, not by the implementing Claude instance.
Complete them before pushing the first release tag.

### Step 1: Generate the signing keypair

Run the Tauri CLI key generation command. The exact CLI command depends on the installed Tauri
version — check the `tauri-plugin-updater` documentation for the current command. The typical
form is:

```bash
npm run tauri signer generate -- -w ~/.tauri/gm-tool.key
```

This produces:
- A **private key file** (keep this secret — never commit it)
- A **public key string** (safe to embed in source)

### Step 2: Add secrets to GitHub

In the repository settings → Secrets and variables → Actions, add:

| Secret name                          | Value                                          |
|--------------------------------------|------------------------------------------------|
| `TAURI_SIGNING_PRIVATE_KEY`          | Contents of the private key file               |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password set during key generation (or empty)  |

### Step 3: Embed the public key

In `app/src-tauri/tauri.conf.json`, replace the `REPLACE_WITH_PUBLIC_KEY` placeholder under
`plugins.updater.pubkey` with the public key string produced in Step 1.

### Step 4: Update the endpoint URL

In `app/src-tauri/tauri.conf.json`, replace `REPLACE_WITH_GITHUB_USERNAME` and
`REPLACE_WITH_REPO_NAME` in the `plugins.updater.endpoints` array with the actual GitHub
username and repository name.

### Step 5: Verify the update manifest URL format

Confirm that `tauri-action` produces a `latest.json` file in the release assets, and that the
endpoint URL format in `tauri.conf.json` matches what `tauri-plugin-updater` expects. Check
both the `tauri-action` and `tauri-plugin-updater` documentation if the first release's update
check does not find the manifest.
