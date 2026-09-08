# Project Claude Configuration

Project-specific facts every role needs by default — check commands, build, package manager, source layout — live directly in this repo's own auto-loaded CLAUDE.md files: see root `CLAUDE.md`'s Tool Use Discipline and App Structure sections. `cut-release` (below) is a release-automation skill local to this repo, since its release process is gm-tool-specific.

## Local Skill: cut-release

### cut-release

Intent: Walk through this project's release process end to end — version bump across all sync locations, CHANGELOG generation from commit history, and a local release commit
Input: Release intent (e.g. "cut a release"), optionally a specific version
Output: A local `chore(release):` commit with version bumps and CHANGELOG entries; instructions to run `pnpm run create-release` to push and trigger CI
Constraints: Never runs `pnpm run create-release` itself; always confirms the target version and shows the full diff before committing; a commit message that doesn't parse into a recognized conventional-commit type is never silently classified — the user is asked
