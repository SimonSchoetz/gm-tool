# pnpm

## `pnpm add` that installs a dependency with a build script not listed under `allowBuilds` failed with `ERR_PNPM_IGNORED_BUILDS` and wrote a placeholder for it under `allowBuilds` in `pnpm-workspace.yaml`

**Verified at:** pnpm 12.4.2
**Citation:** [implement_7: ran `pnpm --version` from `app/` — observed `12.4.2`; ran `pnpm add -D eslint-plugin-import-x@^4.17.1 eslint-import-resolver-typescript@^4.4.5` from `app/` — observed the error `ERR_PNPM_IGNORED_BUILDS` for `unrs-resolver@1.12.2` and `allowBuilds:\n  unrs-resolver: set this to true or false` written to `app/pnpm-workspace.yaml`]

The placeholder is answered by replacing its text with `true` or `false`.

## pnpm's `allowBuilds` maps packages to `true` (run the build script) or `false` (never run it), and with `strictDepBuilds` at its default `true` any install fails while a placeholder is unanswered

**Verified at:** https://pnpm.io/settings/build, 2026-09-30 (unversioned live page; installed pnpm 12.4.2)
**Citation:** [claude_1: https://pnpm.io/settings/build]

An unlisted dependency with a build script is unapproved.
