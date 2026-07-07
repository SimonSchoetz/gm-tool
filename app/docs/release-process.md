# Release Process

## Before releasing

1. **Update the version** in two places:
   - `app/src-tauri/tauri.conf.json` → `"version"` field
   - `app/src-tauri/Cargo.toml` → `[package] version` field
   - `app/package.json` → `version` field
   All must match. Use semver: `MAJOR.MINOR.PATCH`.

2. **Update CHANGELOG.md** (at the repo root):
   - Move all entries under `[Unreleased]` to a new versioned section:
     `## [v1.2.3] - YYYY-MM-DD`
   - Add a new empty `## [Unreleased]` section above it
   - Classify entries by conventional commit type:
     - `feat` commits → `### Added`
     - `fix` commits → `### Fixed`
      - commits that are fixes for unreleased features should not be listed
     - `refactor`, `perf` commits → `### Changed`
     - `chore` commits with user-visible effect → `### Changed`
     - Internal-only `chore`, `docs`, `test`, `style` commits → omit

3. **Make all changes, then ask user to confirm we are ready to commit the version bump and changelog update:**

   ```text
   chore(release): bump version to v1.2.3
   ```

## Cutting the release

The CI workflow verifies that the tagged commit is on `main` before building. The branch must be on the remote before the tag is pushed — pushing the tag first will fail the verification check.

We have a script that triggers all necessary git commans. Run it from `root`:

```bash
npm run create-release
```

The GitHub Actions workflow triggers automatically, builds the installer,
signs it, and publishes a GitHub Release with the update manifest.
