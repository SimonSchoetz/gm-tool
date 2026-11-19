---
paths: [".github/**"]
---

# GitHub workflows and actions

Conventions for any file under `.github/` that names an action: a workflow in `.github/workflows/` or a composite action in `.github/actions/`.

## Every action from another repository is pinned to a full commit SHA

A `uses:` line naming an action from another repository ends in the action's full 40-character commit SHA, then a same-line comment holding the release tag that SHA stands for: `uses: actions/checkout@<sha> # v7.0.1` (an `actions/checkout` step in `.github/workflows/checks.yml`). A tag can be moved or deleted if a bad actor gains access to the action's repository [head-of-instructions_1: https://docs.github.com/en/actions/reference/security/secure-use — "a tag can be moved or deleted if a bad actor gains access to the repository storing the action"], and `tauri-apps/tauri-action` runs in the job that holds the signing key (the `tauri-apps/tauri-action` step of the `build` job in `.github/workflows/build.yml` receives `TAURI_SIGNING_PRIVATE_KEY` in its `env`, and the `build` job in `.github/workflows/release.yml` passes it with `secrets: inherit`). Dependabot's `github-actions` ecosystem raises the SHA and its comment together, but only while the comment stays on the same line (`.claude/knowledge/dependabot.md` — the entry beginning "Dependabot updates the version comment on the same line"), so never change the SHA without its comment or the comment without its SHA.

- A local action or reusable workflow (`uses: ./.github/…`) is this repository's own file and is not pinned.
- An action referenced by a branch name instead of a release tag is pinned to that branch's current commit, with the branch name as the comment: `dtolnay/rust-toolchain@<sha> # stable`, which also passes its toolchain as the `toolchain: stable` input (the `dtolnay/rust-toolchain` step of the `rust` job in `.github/workflows/checks.yml`).
