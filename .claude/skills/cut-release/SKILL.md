---
name: cut-release
description: Walks through this project's release process end to end — determining the version bump, updating it across tauri.conf.json, Cargo.toml, package.json, and package-lock.json, generating the CHANGELOG.md entries from commit history since the last release, and committing once confirmed. Use this whenever the user expresses intent to create, cut, ship, or publish a new release or version of the app, even in passing or without naming specific files or steps — e.g. "let's do a release", "I want to release v1.2.0", "cut a new release", "can we ship this", "time to publish a new version". Do not use this for reading, summarizing, or discussing past releases or CHANGELOG content when there is no intent to create a new one.
---

# Cut Release

This is the single source of truth for how a release is handled in this project — there is no separate process doc to keep in sync, so this file is what changes when the process changes.

## 1. Determine the target version

Read the current version from `app/package.json`. Determine the commit range since the last release: find the most recent commit matching `chore(release): bump version to v*` (`git log --grep="^chore(release): bump version to v" -1 --format=%H`), or fall back to the latest tag (`git describe --tags --abbrev=0`) if no such commit exists yet. List commits in that range with `git log <boundary>..HEAD --oneline`.

If the user already named a specific version (e.g. "release v1.2.0"), use it directly. Otherwise, suggest a bump using standard semver-from-conventional-commits reasoning — the highest-signal rule wins: any commit with a `!` after the type or a `BREAKING CHANGE` footer means major; otherwise any `feat` commit means minor; otherwise patch. State which commits drove the suggestion. This inference is a judgment call with no fixed rule behind it, so always confirm the target version with the user before touching any file — never silently pick a version number.

## 2. Bump the version

Run `node .claude/skills/cut-release/scripts/bump-version.ts <newVersion>` (no `v` prefix, e.g. `0.9.0`) from anywhere in the repo — it resolves its own paths and updates all four locations that must stay in sync: `app/package.json`, `app/package-lock.json` (both the top-level `version` field and `packages[""].version`), `app/src-tauri/tauri.conf.json`, and `app/src-tauri/Cargo.toml`. It prints every file and field it touched — verify the output shows exactly 4 locations across the 3 files before continuing (the lockfile counts as one file with two fields). `bump-version.ts` does not touch `app/src-tauri/Cargo.lock`. Immediately after, run `cargo check` from `app/src-tauri/` to force Cargo's dependency resolution to resync the `gm-tool` package entry in `Cargo.lock` to the new version, then grep `Cargo.lock` for the new version string to confirm the entry updated before continuing.

## 3. Generate the CHANGELOG entries

`CHANGELOG.md`'s `[Unreleased]` section is normally empty between releases in this project — entries aren't added incrementally per commit, they're generated fresh at release time from the commit range gathered in step 1. For each commit in that range, classify by its conventional-commit type:

- `feat` → `### Added`
- `fix` → `### Fixed` — except a fix for something introduced in this same unreleased range (i.e., fixing a bug in a `feat` commit that hasn't shipped yet) doesn't get its own entry, since the feature itself was never released broken
- `refactor`, `perf` → `### Changed`
- `chore` with a user-visible effect → `### Changed`
- `docs`, `test`, `style`, and internal-only `chore` → omit entirely

Write each entry as a user-facing sentence describing the change, not the raw commit subject — the changelog is for the person using the app, not a git log mirror. A commit message that doesn't parse into a recognized type (no `type(scope):` prefix, or an unrecognized type) is not silently dropped or guessed at — list it separately and ask the user how to classify it, since guessing wrong here misrepresents the release to anyone reading the changelog.

## 4. Edit CHANGELOG.md

At the repo root: move the classified entries into a new `## [vX.Y.Z] - YYYY-MM-DD` section (today's date, the version from step 1), placed directly below the existing `## [Unreleased]` heading, keeping `[Unreleased]` itself empty above it for the next cycle. Follow the exact section ordering and heading levels already used by the existing versioned sections in the file — read a couple of them first to match the format precisely rather than inventing a new shape.

## 5. Confirm and commit

Show the user the full diff — the version-file changes and the CHANGELOG.md section — before committing anything. Once confirmed, commit with exactly:

```
chore(release): bump version to vX.Y.Z
```

## 6. Hand off to the release script

This skill's job ends at the local commit. Tell the user to run `npm run create-release` from the repo root when they're ready to actually cut the release — do not run it yourself, since it pushes the branch, creates and pushes the tag, and triggers a CI pipeline that builds, signs, and publishes a real GitHub Release with the update manifest. Remind them of the one sequencing trap: the branch must already be pushed to the remote before the tag is pushed, or the CI workflow's verification step (which checks the tagged commit is on `main`) fails.
