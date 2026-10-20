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
**Citation:** [dependency-update_7: ran `pnpm install` from `app/` against a lockfile holding `@tauri-apps/api@2.12.1` and 13 sibling entries — observed `Verifying lockfile against supply-chain policies (435 entries)`, `Lockfile failed supply-chain policy check`, `Error: ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, `14 lockfile entries failed verification`, a line per entry of the form `<name>@<version> was published at <timestamp>, within the minimumReleaseAge cutoff (2026-09-30T10:32:39.487Z)` for a run whose own timestamp was 2026-10-01T10:32:39, and help text proposing `pnpm clean --lockfile` then `pnpm install` to rebuild from a fresh resolution; ran `pnpm config get minimumReleaseAge` from `app/` — observed `undefined`] [dependency-update_17: <https://pnpm.io/settings/dependency-resolution> — documents `minimumReleaseAge` as a value in minutes whose default is `1440` since v11, says it exists because malicious releases are generally discovered and removed from the registry within an hour, and documents `minimumReleaseAgeExclude` as the companion that exempts named packages, wildcard patterns or exact versions; the setting is listed as belonging to `pnpm-workspace.yaml`]

The 24-hour window the run reported matches the documented default of 1440 minutes, and `pnpm config get` returning `undefined` is consistent with that default applying without the project setting it. The cutoff is reported per run, so an unchanged lockfile stops violating the policy once its entries age past the window.

## `pnpm up <pkg>@<exact-version>` installs a version published within pnpm's release-age window rather than refusing it, and records a `minimumReleaseAgeExclude` list in `pnpm-workspace.yaml` permitting it

**Verified at:** pnpm 12.4.2 — 2026-10-01
**Citation:** [dependency-update_8: ran `pnpm up @tauri-apps/api@2.12.1 @tauri-apps/cli@2.12.1 @tauri-apps/plugin-dialog@2.8.1 @tauri-apps/plugin-sql@2.5.0 @tauri-apps/plugin-opener@2.7.0` from `app/`, where the first three had been published roughly 10 to 14 hours earlier and the last two 1.6 and 4.5 days earlier — observed the install succeed and a `minimumReleaseAgeExclude:` block appear in `app/pnpm-workspace.yaml` holding 14 exact `name@version` entries covering the three recent packages plus every `@tauri-apps/cli-*` platform binary, and neither of the two older ones; ran the same command with 2.12.0 and 2.8.0 substituted for 2.12.1 and 2.8.1 — observed the install succeed with no such block written]

The written entries name exact versions and carry no expiry, so they stay in the file after those versions age past the window; nothing was observed pruning them. Asking instead for a version already older than the window installed it with no block written.

## pnpm 12.4.2 ignores a project's own `engines.node`: an unsatisfiable range still installs, under `install` and `add`, with the `--engine-strict` flag and with `engine-strict=true` in `.npmrc`

**Verified at:** pnpm 12.4.2 on Node v24.21.0 — 2026-10-17
**Citation:** [dependency-update_18: set `engines.node` to the unsatisfiable `">=99.0.0"` in a throwaway copy of this repository's `app/` manifest, then from that directory on Node v24.21.0 ran `pnpm --version` — observed `12.4.2` — followed by `pnpm install --frozen-lockfile`, the same command with `--engine-strict`, a plain `pnpm install`, and `pnpm add -D is-odd@3.0.1` with `engine-strict=true` written to a local `.npmrc` — observed exit 0 from every one and no output line matching engine, unsupported or ERR_]

The unsatisfiable range is the control: a field being read at all would have failed on it.

## pnpm 12.4.2 ran the project's own `prepare` script under `pnpm install --frozen-lockfile` into a missing `node_modules`, and did not run it under `pnpm install --frozen-lockfile` or `pnpm install` when `node_modules` was already up to date

**Verified at:** pnpm 12.4.2 on Node v24.21.0 — 2026-10-19
**Citation:** [harness-follow-ups_12: https://pnpm.io/cli/install — `--ignore-scripts` "Do not execute any scripts defined in the project `package.json` and its dependencies"] [harness-follow-ups_13: ran `pnpm install --frozen-lockfile` in `app/` of a fresh `git clone` whose manifest held `"prepare": "tsr generate"` and which had no `node_modules` — observed `Done in 1.5s using pnpm v12.4.2` and `src/routeTree.gen.ts` written, a file nothing else in that clone produces; in a checkout whose `node_modules` was current, deleted that file and ran `pnpm install --frozen-lockfile` and then `pnpm install` — observed "Lockfile is up to date, resolution step is skipped" and "Already up to date", and the file not written; ran `node --version` — observed `v24.21.0`]

Whether `preinstall`, `postinstall` or dependency build scripts follow the same pattern was not probed.

## pnpm 12.4.2's `pnpm runtime set node 24 -g` links only `node` into the global bin directory, not `npm` or `npx`

**Verified at:** pnpm 12.4.2 on macOS arm64, installing Node 24.22.0 — 2026-10-20
**Citation:** [release-check_7: with `PNPM_HOME` and `XDG_DATA_HOME` pointed at an empty scratch directory and `$PNPM_HOME/bin` first on `PATH`, ran `pnpm runtime set node 24 -g` on macOS arm64 — observed `+ node 24.22.0` and `Done in 2.7s using pnpm v12.4.2`; `ls -la $PNPM_HOME/bin` listed `node` and the dotfile `.pnpm-shim-v1-node-target`, no `npm` or `npx`; `command -v npx npm` resolved both outside `$PNPM_HOME`]

A step that calls `npx` or `npm` after a global `pnpm runtime set` gets them from another Node installation on `PATH`, if there is one.
