# GitHub Actions

## Workflow runs can restore caches created on the default branch, but not caches created for a different tag name

**Verified at:** <https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching> — 2026-10-20
**Citation:** [release-check_1: https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching — restrictions for accessing a cache: "Workflow runs can restore caches created in either the current branch or the default branch", "Workflow runs also cannot restore caches created for different tag names", with a cache created for tag `release-a` not accessible to a run for tag `release-b`; entries not accessed in over 7 days are removed; a second read of the same section found no sentence on whether a later run for the same tag can restore that tag's caches]

A cache saved by the run for one version tag is unavailable to the run for the next version tag. The page does not say whether a later run for the same tag can restore that tag's caches. Entries not accessed in over 7 days are removed.

## The `env` context, which holds workflow-level `env` values, is available in a step's `with` inputs

**Verified at:** <https://docs.github.com/en/actions/reference/workflows-and-actions/contexts> — 2026-10-20
**Citation:** [release-check_2: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts — the Context availability table lists `github, needs, strategy, matrix, job, runner, env, vars, secrets, steps, inputs` for `jobs.<job_id>.steps.with`; the page says the `env` context can be used in any step key except `id` and `uses`, and its example sets `mascot: Mona` in workflow-level `env` and reads it in a step as `${{ env.mascot }}`]

It is not available in `id` or `uses`, so an action's ref cannot come from `env`.

## On 2026-10-20 the runner-images README mapped `macos-latest` to the macOS 26 arm64 image, whose README listed Node.js 24.21.0 with npm 11.19.0 and Rust 1.99.0 with Clippy and Rustfmt

**Verified at:** actions/runner-images README and `images/macos/macos-26-arm64-Readme.md` — 2026-10-20
**Citation:** [release-check_3: ran `gh api repos/actions/runner-images/readme` — observed the macOS 26 Arm64 row listing `macos-latest`; ran `gh api repos/actions/runner-images/contents/images/macos/macos-26-arm64-Readme.md` — observed `Node.js 24.21.0`, `NPM 11.19.0`, `Rust 1.99.0`, `Clippy 0.1.99`, `Rustfmt 1.10.0-stable`]

No job was run on the image; both READMEs are the only source.

## `dtolnay/rust-toolchain@stable` installs its toolchain with rustup's `minimal` profile, which has no Clippy or Rustfmt, and adds a component only when its `components` input names it

**Verified at:** dtolnay/rust-toolchain `stable` branch at `b725eda`; <https://rust-lang.github.io/rustup/concepts/profiles.html> — 2026-10-20
**Citation:** [release-check_4: ran `gh api repos/dtolnay/rust-toolchain/contents/action.yml?ref=stable` — observed `rustup toolchain install "$toolchain" "${flags[@]}" --profile minimal`, with `--component` flags built from the `components` input, split "on commas and whitespace"] [release-check_10: https://rust-lang.github.io/rustup/concepts/profiles.html — "The minimal profile includes as few components as possible to get a working compiler (rustc, rust-std, and cargo)"; the default profile adds rust-docs, rustfmt and clippy]

A job that runs `cargo clippy` or `cargo fmt` after this action passes `components: clippy, rustfmt`.

## `pnpm/setup@v2` installs its `runtime` input by running `pnpm runtime set <name> <version> -g`

**Verified at:** pnpm/setup `v2` at `703c526` — 2026-11-19
**Citation:** [implement_5: read pnpm/setup at `703c526` — `src/index.ts` `runMain` passes `resolveRuntimeRequests(inputs)` to `installRuntime(request, result.binDest)`, and `src/install-runtime/index.ts` `installRuntime` runs `runPnpm(binDest, ['runtime', 'set', request.name, request.version, '-g'])`]

For `runtime: node@24` under pnpm 12.4.2 that links only `node`, no `npx` or `npm` (`.claude/knowledge/pnpm.md`), so `npx` in such a job comes from another Node installation on `PATH`, if there is one.

## `pnpm/setup@v2` caches the pnpm store only with `cache: true`, under a key made of the runner OS, the CPU architecture, a hash of the runtimes and a hash of the files `cache-dependency-path` names

**Verified at:** pnpm/setup `v2` at `703c526` — 2026-11-19
**Citation:** [implement_6: ran `gh api repos/pnpm/setup/contents/action.yml?ref=703c526` and read `src/cache-restore/keys.ts`, `src/cache-restore/run.ts`, `src/cache-save/run.ts` and `src/index.ts` at the same ref — observed `cache` defaulting to `'false'`, the prefix `pnpm-cache-<RUNNER_OS>-<arch>-<hash of the runtime requests>-` used as the restore key, the primary key `<prefix><hash of the installed runtimes>-<hashFiles(cache-dependency-path)>`, the cached path taken from `pnpm store path`, a save that is skipped when no primary key was recorded or when it equals the restored key, `src/cache-restore/run.ts` `finalizeCache` setting the `cache-hit` output to `restoredKey === primaryKey`, the `install` input described in `action.yml` as whether to run `pnpm install` after pnpm and the runtime are set up, and `src/index.ts` `runMain` calling `restoreCache(inputs, requests)` before the runtime installs and before `if (inputs.install)`]

With `cache: true`, the action calls its cache restore before, and independently of, its `install` input, which decides whether the action runs `pnpm install` itself. When the exact key is absent the restore falls back to the prefix, restores an older store and sets the `cache-hit` output to false.

## `tauri-apps/tauri-action@v0`'s own TypeScript source starts no `git` command; its only subprocesses are the Tauri CLI, `npm install -g @tauri-apps/cli` and `tar`

**Verified at:** tauri-apps/tauri-action `v0` at `84b9d35` — 2026-10-20
**Citation:** [release-check_6: listed `src/*.ts` at ref `v0` with `gh api repos/tauri-apps/tauri-action/git/trees/v0?recursive=1` and grepped each file for `execa|spawn|exec(|getExecOutput` — observed only `execa` in `src/utils.ts`, wrapped by `execCommand`, whose call sites are `src/runner.ts` (the Tauri CLI binary and `npm install -g @tauri-apps/cli@<tag>`) and `src/index.ts` (`tar czf`); the same files grepped for `child_process|execSync|execFile|spawnSync` matched nothing, and for `git` only `@actions/github` API usage]

Only `src/*.ts` was searched; the built `dist/` and what the Tauri CLI it launches runs were not.

## A cache created by a workflow run on a pull request is created for its merge ref and only a re-run of that pull request can restore it

**Verified at:** <https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching — "When a cache is created by a workflow run triggered on a pull request, the cache is created for the merge ref (refs/pull/.../merge)... can only be restored by re-runs of the pull request. It cannot be restored by the base branch or other pull requests targeting that base branch."]

No run was made; the page is the only source.

## A repository's Actions cache storage is limited to 10 GB by default, and past the limit the caches with the oldest last access are deleted first

**Verified at:** <https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching — "By default, the limit is 10 GB per repository", "the cache eviction policy will create space by deleting the caches in order of last access date, from oldest to most recent"]

No run was made; the page is the only source.

## `Swatinem/rust-cache@v2` builds its key from the prefix, the `key` input, the job id, the runner OS and CPU architecture, a hash of the Rust environment and a hash of the manifests and lockfiles

**Verified at:** Swatinem/rust-cache `v2` at `d1527c8`, `src/config.ts` — 2026-11-19
**Citation:** [implement_2: ran `gh api repos/Swatinem/rust-cache/contents/src/config.ts?ref=v2` — observed `key = prefix-key`, then `-<shared-key>` or `-<key input>` and `-<process.env.GITHUB_JOB>`, then `-<os.type()>-<os.arch()>` (lines 73–93), then the Rust-environment hash (lines 128–131) and the manifest and lockfile hash (lines 154–260); the `shared-key` branch (lines 75–77) adds only the shared key, and the job id is added only when `add-job-id-key` is `true` (line 85)]

The job id is part of the key by default, because `add-job-id-key` defaults to `true` in `action.yml`, and a `shared-key` input is used instead of the `key` input and the job id. Only the source of the action was read; no job was run.

## `Swatinem/rust-cache@v2` saves its cache in a post step, skips the save when `save-if` is `false`, and still saves after a failed job when `cache-on-failure` is `true`, which its restore step exports as `CACHE_ON_FAILURE`

**Verified at:** Swatinem/rust-cache `v2` at `d1527c8`, `action.yml` — 2026-11-19
**Citation:** [implement_3: ran `gh api repos/Swatinem/rust-cache/contents/action.yml?ref=v2` — observed `save-if` described as "If `false`, the cache is only restored." with default `"true"`, `cache-on-failure` as "Cache even if the build fails", and `post: "dist/save.js"` with `post-if: "success() || env.CACHE_ON_FAILURE == 'true'"`] [implement_4: ran `gh api repos/Swatinem/rust-cache/contents/src/save.ts?ref=v2` — observed `const save = core.getInput("save-if").toLowerCase() || "true"` at line 18] [implement_5: ran `gh api repos/Swatinem/rust-cache/contents/src/restore.ts?ref=v2` — observed `core.getInput("cache-on-failure")` at line 23 and `core.exportVariable("CACHE_ON_FAILURE", cacheOnFailure)` at line 29]

Only the source of the action was read; no job was run.

## `pnpm/setup@v2` marks its `package-json-file` input deprecated in favour of `working-directory`, and still honours it when it is set on its own

**Verified at:** pnpm/setup `v2` at `703c526` — 2026-11-19
**Citation:** [implement_7: ran `gh api repos/pnpm/setup/contents/action.yml?ref=703c526` — observed `package-json-file` described as "Deprecated. Use `working-directory` instead... Still honoured when set on its own — the directory containing the file becomes the working directory", with a `deprecationMessage`]

Only the action's metadata file was read; no job was run.

## `tauri-apps/tauri-action@v0` treats a build that yields no artifacts as an error only when `releaseId` or `tagName` is set

**Verified at:** tauri-apps/tauri-action `v0` at `84b9d35` — 2026-11-19
**Citation:** [implement_1: ran `gh api repos/tauri-apps/tauri-action/contents/src/index.ts?ref=v0` and `…/src/build.ts?ref=v0` — observed `buildProject` returning `artifacts.filter((p) => existsSync(p.path))` (`src/build.ts:576`), and `src/index.ts` lines 123–131 throwing `No artifacts were found.` when `releaseId || tagName` and otherwise logging that this "is not handled as an error" and returning] [implement_2: ran `gh api repos/tauri-apps/tauri-action/commits/v0 --jq .sha` — observed `84b9d35b5fc46c1e45415bdb6144030364f7ebc5`]

Only the action's source was read; no run of the action was made.
