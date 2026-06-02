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

   ```text
   chore(release): bump version to v1.2.3
   ```

## Cutting the release

The CI workflow verifies that the tagged commit is on `main` before building. The branch must be on the remote before the tag is pushed — pushing the tag first will fail the verification check.

```bash
git push origin main
git tag v1.2.3
git push origin v1.2.3
```

The GitHub Actions workflow triggers automatically, builds the installer,
signs it, and publishes a GitHub Release with the update manifest.

## First release only: keypair setup

See the Manual Setup Brief — this is a one-time step performed before the
first release tag is pushed.
