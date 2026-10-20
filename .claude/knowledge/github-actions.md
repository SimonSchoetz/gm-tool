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

**Verified at:** pnpm/setup `v2` at `84cb39b` — 2026-10-20
**Citation:** [release-check_8: read pnpm/setup at `84cb39b` — `src/inputs/index.ts:31` reads the `runtime` input and `:60` stores it as `runtime: parseRuntime()`; `src/index.ts:28-30` passes it through `resolveRuntimeRequest(inputs)` to `installRuntime(request, …)`; `src/install-runtime/index.ts:46` runs `runPnpm(binDest, ['runtime', 'set', request.name, request.version, '-g'])`]

For `runtime: node@24` under pnpm 12.4.2 that links only `node`, no `npx` or `npm` (`.claude/knowledge/pnpm.md`), so `npx` in such a job comes from another Node installation on `PATH`, if there is one.

## `pnpm/setup@v2` caches the pnpm store only with `cache: true`, keyed on a hash of the files `cache-dependency-path` names (default `pnpm-lock.yaml`)

**Verified at:** pnpm/setup `v2` at `84cb39b` — 2026-10-20
**Citation:** [release-check_5: ran `gh api repos/pnpm/setup/contents/action.yml?ref=v2` and read `src/cache-restore/index.ts`, `src/cache-restore/run.ts`, `src/cache-save/run.ts` and `src/pnpm-store-prune/index.ts` at the same ref — observed `cache` defaulting to `'false'` and `cache-dependency-path` to `'pnpm-lock.yaml'`, the cached path taken from `pnpm store path`, the key `pnpm-cache-<RUNNER_OS>-<arch>-<hashFiles(cache-dependency-path)>`, and the post step running `pnpm store prune` and saving only when `cache` is true] [release-check_11: read `src/index.ts` at `84cb39b` — `:38` calls `restoreCache(inputs)` before `:40` checks `inputs.install`]

With `cache: true`, the action calls its cache restore before, and independently of, its `install` input, which decides whether the action runs `pnpm install` itself.

## `tauri-apps/tauri-action@v0`'s own TypeScript source starts no `git` command; its only subprocesses are the Tauri CLI, `npm install -g @tauri-apps/cli` and `tar`

**Verified at:** tauri-apps/tauri-action `v0` at `84b9d35` — 2026-10-20
**Citation:** [release-check_6: listed `src/*.ts` at ref `v0` with `gh api repos/tauri-apps/tauri-action/git/trees/v0?recursive=1` and grepped each file for `execa|spawn|exec(|getExecOutput` — observed only `execa` in `src/utils.ts`, wrapped by `execCommand`, whose call sites are `src/runner.ts` (the Tauri CLI binary and `npm install -g @tauri-apps/cli@<tag>`) and `src/index.ts` (`tar czf`); the same files grepped for `child_process|execSync|execFile|spawnSync` matched nothing, and for `git` only `@actions/github` API usage]

Only `src/*.ts` was searched; the built `dist/` and what the Tauri CLI it launches runs were not.
