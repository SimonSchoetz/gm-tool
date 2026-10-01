# pnpm

## `pnpm add` that installs a dependency with a build script not listed under `allowBuilds` failed with `ERR_PNPM_IGNORED_BUILDS` and wrote a placeholder for it under `allowBuilds` in `pnpm-workspace.yaml`

**Verified at:** pnpm 12.4.2
**Citation:** [implement_7: ran `pnpm --version` from `app/` — observed `12.4.2`; ran `pnpm add -D eslint-plugin-import-x@^4.17.1 eslint-import-resolver-typescript@^4.4.5` from `app/` — observed the error `ERR_PNPM_IGNORED_BUILDS` for `unrs-resolver@1.12.2` and `allowBuilds:\n  unrs-resolver: set this to true or false` written to `app/pnpm-workspace.yaml`]

The placeholder is answered by replacing its text with `true` or `false`.

## pnpm's `allowBuilds` maps packages to `true` (run the build script) or `false` (never run it), and with `strictDepBuilds` at its default `true` any install fails while a placeholder is unanswered

**Verified at:** <https://pnpm.io/settings/build>, 2026-09-30 (unversioned live page; installed pnpm 12.4.2)
**Citation:** [claude_1: https://pnpm.io/settings/build]

An unlisted dependency with a build script is unapproved.

## `pnpm install` against a committed lockfile refused to proceed because 14 of its entries had been published less than 24 hours earlier, reporting `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`

**Verified at:** pnpm 12.4.2 — 2026-10-01
**Citation:** [dependency-update_7: ran `pnpm install` from `app/` against a lockfile holding `@tauri-apps/api@2.12.1` and 13 sibling entries — observed `Verifying lockfile against supply-chain policies (435 entries)`, `Lockfile failed supply-chain policy check`, `Error: ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, `14 lockfile entries failed verification`, a line per entry of the form `<name>@<version> was published at <timestamp>, within the minimumReleaseAge cutoff (2026-09-30T10:32:39.487Z)` for a run whose own timestamp was 2026-10-01T10:32:39, and help text proposing `pnpm clean --lockfile` then `pnpm install` to rebuild from a fresh resolution; ran `pnpm config get minimumReleaseAge` from `app/` — observed `undefined`]

The reported cutoff sat exactly 24 hours before the run while `pnpm config get` reported no configured value, so the window came from pnpm rather than from this repository. Whether other pnpm 12.x releases apply the same window was not checked.

## `pnpm up <pkg>@<exact-version>` installs a version published within pnpm's release-age window rather than refusing it, and records a `minimumReleaseAgeExclude` list in `pnpm-workspace.yaml` permitting it

**Verified at:** pnpm 12.4.2 — 2026-10-01
**Citation:** [dependency-update_8: ran `pnpm up @tauri-apps/api@2.12.1 @tauri-apps/cli@2.12.1 @tauri-apps/plugin-dialog@2.8.1 @tauri-apps/plugin-sql@2.5.0 @tauri-apps/plugin-opener@2.7.0` from `app/`, where the first three had been published roughly 10 to 14 hours earlier and the last two 1.6 and 4.5 days earlier — observed the install succeed and a `minimumReleaseAgeExclude:` block appear in `app/pnpm-workspace.yaml` holding 14 exact `name@version` entries covering the three recent packages plus every `@tauri-apps/cli-*` platform binary, and neither of the two older ones; ran the same command with 2.12.0 and 2.8.0 substituted for 2.12.1 and 2.8.1 — observed the install succeed with no such block written]

The written entries name exact versions and carry no expiry, so they stay in the file after those versions age past the window; nothing was observed pruning them. Asking instead for a version already older than the window installed it with no block written.
