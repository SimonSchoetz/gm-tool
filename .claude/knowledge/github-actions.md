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

## `pnpm/setup@v3` installs its `runtime` input by running `pnpm runtime set <name> <version> -g`

**Verified at:** pnpm/setup `v3.1.2` at `fa36a5e` — 2026-11-19
**Citation:** [dependabot-triage_10: read pnpm/setup at `fa36a5e` — `src/index.ts` `runMain` calls `installRuntime(request, result.binDest)` at line 42, and `src/install-runtime/index.ts` line 70 runs `runPnpm(binDest, ['runtime', 'set', request.name, request.version, '-g'])`]

For `runtime: node@24` under pnpm 12.4.2 that links only `node`, no `npx` or `npm` (`.claude/knowledge/pnpm.md`), so `npx` in such a job comes from another Node installation on `PATH`, if there is one.

## `pnpm/setup@v3` caches the pnpm store only with `cache: true`, saving under a key unique to each run that starts with the runner OS, the CPU architecture, a hash of the runtimes and a hash of the files `cache-dependency-path` names

**Verified at:** pnpm/setup `v3.1.2` at `fa36a5e` — 2026-11-19
**Citation:** [dependabot-triage_11: read `src/cache-restore/keys.ts`, `src/cache-restore/run.ts`, `src/cache-save/run.ts` and `src/index.ts` at `fa36a5e` — observed the prefix `pnpm-cache-<RUNNER_OS>-<arch>-<hash of the runtime requests>-` from `getCacheKeyPrefix`, the lockfile prefix `<prefix><hashFiles(cache-dependency-path)>-` tried first and the bare prefix second as restore keys, the save key `<lockfile prefix><hash of the installed runtimes>-<GITHUB_RUN_ID>-<run attempt>-<random UUID>` from `getSaveCacheKey`, a save skipped when the store is unchanged since the restore, and `restoreCache(inputs, requests)` at `src/index.ts:37` before the runtime installs and before `if (inputs.install)` at line 76] [dependabot-triage_15: https://github.com/pnpm/setup/releases/tag/v3.0.0 — "fix!: include runid in cache key, restore freshest lockfile match" (#43)]

With `cache: true`, the action restores before, and independently of, its `install` input. Because every save key is new, each run whose store changed adds a cache entry rather than replacing one.

## `tauri-apps/tauri-action@v1`'s own TypeScript source starts no `git` command; its only subprocesses are the Tauri CLI, `npm install -g @tauri-apps/cli`, `tar`, and `which` (`where.exe` on Windows) to check that a package runner is installed

**Verified at:** tauri-apps/tauri-action `v1.0.0` at `1deb371` — 2026-11-19
**Citation:** [dependabot-triage_16: grepped `src/*.ts` of a clone at `1deb371` for `execa|spawn|exec(|getExecOutput|child_process|execSync|execFile` — observed only `execa` and `execaSync` imported in `src/utils.ts:11`, `execaSync(bin, [runner])` in `isRunnerInstalled` at line 469 with `bin` set to `which` or `where.exe`, and `execCommand` (line 476) called from `src/runner.ts` (the Tauri CLI binary at line 41, `npm install -g @tauri-apps/cli@v2` at line 77) and `src/index.ts` (`tar` at line 82); a grep for `git` outside `github` matched only a `gitignore: true` option]

Only `src/*.ts` was searched; the built `dist/` and what the Tauri CLI it launches runs were not.

## A cache created by a workflow run on a pull request is created for its merge ref and only a re-run of that pull request can restore it

**Verified at:** <https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching — "When a cache is created by a workflow run triggered on a pull request, the cache is created for the merge ref (refs/pull/.../merge)... can only be restored by re-runs of the pull request. It cannot be restored by the base branch or other pull requests targeting that base branch."]

No run was made; the page is the only source.

## A repository's Actions cache storage is limited to 10 GB by default, and past the limit the caches with the oldest last access are deleted first

**Verified at:** <https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching — "By default, the limit is 10 GB per repository", "the cache eviction policy will create space by deleting the caches in order of last access date, from oldest to most recent"]

No run was made; the page is the only source.

## `Swatinem/rust-cache@v2` builds its key from `prefix-key`, the `key` input and by default the job id (or a `shared-key` instead of both), the runner OS and CPU architecture, a hash of the Rust environment and a hash of the manifests and lockfiles

**Verified at:** Swatinem/rust-cache `v2` at `d1527c8`, `src/config.ts` and `action.yml` — 2026-11-19
**Citation:** [implement_2: ran `gh api repos/Swatinem/rust-cache/contents/src/config.ts?ref=v2` — observed `key = prefix-key`, then `-<shared-key>` or `-<key input>` and `-<process.env.GITHUB_JOB>`, then `-<os.type()>-<os.arch()>` (lines 73–93), then the Rust-environment hash (lines 128–131) and the manifest and lockfile hash (lines 154–260); the `shared-key` branch (lines 75–77) adds only the shared key, and the job id is added only when `add-job-id-key` is `true` (line 85)] [implement_3: ran `gh api repos/Swatinem/rust-cache/contents/action.yml?ref=v2` — observed `add-job-id-key` with `default: "true"`] [implement_9: ran `gh api repos/Swatinem/rust-cache/commits/v2 --jq .sha` — observed `d1527c8f67ef9af357290475d4af4b0fab8f12e0`]

The job id is part of the key by default, and a `shared-key` input is used instead of the `key` input and the job id. Only the source of the action was read; no job was run.

## `Swatinem/rust-cache@v2` saves its cache in a post step and skips the save when `save-if` is `false`

**Verified at:** Swatinem/rust-cache `v2` at `d1527c8`, `action.yml` and `src/save.ts` — 2026-11-19
**Citation:** [implement_1: ran `gh api repos/Swatinem/rust-cache/contents/action.yml?ref=v2` — observed `save-if` described as "If `false`, the cache is only restored." with default `"true"`, and `post: "dist/save.js"`] [implement_2: ran `gh api repos/Swatinem/rust-cache/contents/src/save.ts?ref=v2` — observed `const save = core.getInput("save-if").toLowerCase() || "true"` at line 18] [implement_9: ran `gh api repos/Swatinem/rust-cache/commits/v2 --jq .sha` — observed `d1527c8f67ef9af357290475d4af4b0fab8f12e0`]

Only the source of the action was read; no job was run.

## `Swatinem/rust-cache@v2` saves after a failed job when `cache-on-failure` is `true`, which its restore step exports as `CACHE_ON_FAILURE`

**Verified at:** Swatinem/rust-cache `v2` at `d1527c8`, `action.yml` and `src/restore.ts` — 2026-11-19
**Citation:** [implement_1: ran `gh api repos/Swatinem/rust-cache/contents/action.yml?ref=v2` — observed `cache-on-failure` described as "Cache even if the build fails" and `post-if: "success() || env.CACHE_ON_FAILURE == 'true'"`] [implement_2: ran `gh api repos/Swatinem/rust-cache/contents/src/restore.ts?ref=v2` — observed `core.getInput("cache-on-failure")` at line 23 and `core.exportVariable("CACHE_ON_FAILURE", cacheOnFailure)` at line 29] [implement_9: ran `gh api repos/Swatinem/rust-cache/commits/v2 --jq .sha` — observed `d1527c8f67ef9af357290475d4af4b0fab8f12e0`]

Only the source of the action was read; no job was run.

## `pnpm/setup@v3` marks its `package-json-file` input deprecated in favour of `working-directory`, and still honours it when it is set on its own

**Verified at:** pnpm/setup `v3.1.2` at `fa36a5e` — 2026-11-19
**Citation:** [dependabot-triage_12: read `action.yml` at `fa36a5e`, lines 108–115 — observed `package-json-file` described as "Deprecated. Use `working-directory` instead... Still honoured when set on its own — the directory containing the file becomes the working directory", with a `deprecationMessage`]

Only the action's metadata file was read; no job was run.

## `pnpm/setup@v3` skips saving its store cache when `save-cache` is `false`

**Verified at:** pnpm/setup `v3.1.2` at `fa36a5e` — 2026-11-19
**Citation:** [dependabot-triage_13: read `action.yml` at `fa36a5e` — observed the input `save-cache`, default `'true'`, described as whether to save the pnpm store at the end of the job when `cache` is `true`, and `src/cache-save/index.ts` line 7 returning before the save when `!inputs.cache || !inputs.saveCache`] [dependabot-triage_14: https://github.com/pnpm/setup/releases/tag/v3.1.0 — "feat: add `save-cache` and skip saving an unchanged store"]

Only the action's metadata and `src/cache-save/index.ts` were read; no job was run.

## `tauri-apps/tauri-action@v1` treats a build that yields no artifacts as an error only when `releaseId` or `tagName` is set or workflow-artifact upload is enabled

**Verified at:** tauri-apps/tauri-action `v1.0.0` at `1deb371` — 2026-11-19
**Citation:** [dependabot-triage_17: read `src/index.ts` and `src/build.ts` of a clone at `1deb371` — observed `buildProject` returning `artifacts.filter((p) => existsSync(p.path))` (`src/build.ts:517`), and `src/index.ts` throwing `No artifacts were found.` at line 43 when `releaseId || tagName || shouldUploadWorkflowArtifacts`, and otherwise logging at line 46 that this "is not handled as an error" and returning]

Only the action's source was read; no run of the action was made.

## The REST endpoint `releases/latest` returns the most recent published release that is neither a draft nor a prerelease

**Verified at:** <https://docs.github.com/en/rest/releases/releases#get-the-latest-release> — 2026-11-19
**Citation:** [architect_1: https://docs.github.com/en/rest/releases/releases#get-the-latest-release — "The latest release is the most recent non-prerelease, non-draft release"]

Only the REST page was read; it does not state how the `/releases/latest/download/<file>` web URL form picks its release.

## `tauri-apps/tauri-action@v1` finds a draft release by listing all releases and matching the tag, and creates one when none matches

**Verified at:** tauri-apps/tauri-action `v1.0.0` at `1deb371` — 2026-11-19
**Citation:** [dependabot-triage_18: read `src/create-release.ts` of a clone at `1deb371` — the comment "you can't get a an existing draft by tag" at line 70, `release.tag_name === tagName` over the `listReleases` pages at line 76, `throw new Error('release not found')` at line 93 and `createRelease` for that error at line 113]

Only the action's source was read; no run of the action was made.

## `tauri-apps/tauri-action@v1` skips its release lookup and creation when `releaseId` is set and uploads to that release, so with `releaseId` set its `tagName` input changes nothing

**Verified at:** tauri-apps/tauri-action `v1.0.0` at `1deb371` — 2026-11-19
**Citation:** [dependabot-triage_19: read `src/index.ts` of a clone at `1deb371` — `tagName` read at line 29 and used only in `releaseId || tagName || shouldUploadWorkflowArtifacts` at line 42 and in the block `if (tagName && !releaseId) {` at line 102, which holds the lookup and creation (`getOrCreateRelease` at line 118, the only caller of `src/create-release.ts`), and `if (releaseId) {` at line 128 before the upload, whose `uploadVersionJSON` call takes no tag]

Only the action's source was read; no run of the action was made.

## `tauri-apps/tauri-action@v1` writes each `latest.json` platform URL as the REST API URL of the uploaded asset, `<GITHUB_API_URL>/repos/<owner>/<repo>/releases/assets/<asset id>`

**Verified at:** tauri-apps/tauri-action `v1.0.0` at `1deb371` — 2026-11-19
**Citation:** [dependabot-triage_20: read `src/upload-version-json.ts` and `src/inputs.ts` of a clone at `1deb371` — the download URL built as `${githubBaseUrl}/repos/${owner}/${repo}/releases/assets/${data.id}` at `src/upload-version-json.ts:97`, and `githubBaseUrl` taken from the `githubBaseUrl` input, else `GITHUB_API_URL`, else `https://api.github.com` at `src/inputs.ts:64-67`] [dependabot-triage_28: ran `gh api repos/SimonSchoetz/gm-tool/releases/tags/v0.17.0 --jq '.assets[0] | {url, browser_download_url}'` — observed `url` `https://api.github.com/repos/SimonSchoetz/gm-tool/releases/assets/707232423`] [dependabot-triage_21: https://github.com/tauri-apps/tauri-action/releases/tag/action-v1.0.0 — "The download urls in `latest.json` will now use the github url instead of the browser download url" (#1315)]

The URL carries no tag; it has the form of a release asset's own `url` field in the REST API.

## `tauri-apps/tauri-action@v1` deletes an existing release asset whose label or name matches and then uploads the new one, setting the asset's label to its file name

**Verified at:** tauri-apps/tauri-action `v1.0.0` at `1deb371` — 2026-11-19
**Citation:** [dependabot-triage_22: read `src/upload-release-assets.ts` of a clone at `1deb371` — the match `a.label === assetName || a.name === assetNameGH` at line 55, `Deleting existing ${assetName}...` at line 59 followed by `deleteReleaseAsset` at line 60, then `uploadReleaseAsset` at line 71 with `label: assetName` at line 75]

Only the action's source was read; no run of the action was made.

## `tauri-apps/tauri-action@v1` merges `latest.json` per job by listing the release's assets, reading the existing file, copying its `platforms`, adding its own and replacing the asset

**Verified at:** tauri-apps/tauri-action `v1.0.0` at `1deb371` — 2026-11-19
**Citation:** [dependabot-triage_23: read `src/upload-version-json.ts` of a clone at `1deb371` — `listReleaseAssets` at line 57, `versionContent.platforms` taken from the existing file at line 82, the job's own platform keys set from line 229, `writeFileSync` of the merged file at line 274, `deleteReleaseAsset` for the old file at line 278 and `uploadAssets` of the new file at line 294]

Concurrent jobs of one release each read before writing, so a platform one of them added can be lost when another writes last; this is inferred from the read-modify-write order, and no run was made.

## `tauri-apps/tauri-action@v1` names a macOS updater archive `<productName>_<version>_<arch>.app.tar.gz`, with `aarch64` for Apple silicon and `x64` for Intel, where v0 left the version out

**Verified at:** tauri-apps/tauri-action `v1.0.0` at `1deb371` — 2026-11-19
**Citation:** [dependabot-triage_24: read `src/utils.ts` and `src/build.ts` of a clone at `1deb371` — `getAssetName` sending `.app.tar.gz` and `.app.tar.gz.sig` past the keep-the-file-name branch at `src/utils.ts:104`, setting `` version = `_${asset.version}` `` at line 133 and returning `name + platform + version + arch + asset.ext` at line 136, with `platform` left empty unless `asset.name === 'binary'` (lines 122–127), and the macOS arch mapped `x86_64` to `x64` and `arm64` to `aarch64` at `src/build.ts:77-80`] [dependabot-triage_25: https://github.com/tauri-apps/tauri-action/releases/tag/action-v1.0.0 — "`.app.tar.gz` & `.app.tar.gz.sig` files will now include the app version like all other bundles/installers" (#1194)]

The installers already carried the version in their file names under v0.

## The `make_latest` field of the create-release and update-release endpoints takes the strings `true`, `false` or `legacy`

**Verified at:** <https://docs.github.com/en/rest/releases/releases> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/rest/releases/releases — the "Create a release" and "Update a release" parameters: "make_latest string … Drafts and prereleases cannot be set as latest. Defaults to true for newly published releases … Can be one of: true, false, legacy"]

The page says `legacy` determines the latest release by creation date and higher semantic version, and that `true` is the default for a newly published release. Only the documentation page was read; no request was sent.

## A release asset's binary content is fetched from `GET /repos/{owner}/{repo}/releases/assets/{asset_id}` with the header `Accept: application/octet-stream`, and the answer is a 200 or a redirect

**Verified at:** <https://docs.github.com/en/rest/releases/assets> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/rest/releases/assets — "Get a release asset": "set the Accept header of the request to application/octet-stream. The API will either redirect the client to the location, or stream it directly if possible. API clients should handle both a 200 or 302 response."] [implement_2: ran `gh api -H 'Accept: application/octet-stream' repos/SimonSchoetz/gm-tool/releases/assets/<id of the v0.17.0 latest.json>` — observed the file's JSON on standard output, with `gh` following the redirect]

The run was made on an asset of a published release; the download of an asset of a draft release was not run.

## An action's tag can be moved or deleted by anyone who gains access to the repository that stores the action

**Verified at:** <https://docs.github.com/en/actions/reference/security/secure-use> — 2026-11-19
**Citation:** [head-of-instructions_1: https://docs.github.com/en/actions/reference/security/secure-use — "a tag can be moved or deleted if a bad actor gains access to the repository storing the action"]

GitHub's secure-use reference gives this as the risk of referencing a third-party action by a tag.

## Inside a reusable workflow called with `workflow_call`, the `github` context is the caller workflow's

**Verified at:** <https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations> — 2026-11-19
**Citation:** [docs-only-checks_1: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations — section "`github` context": "When a reusable workflow is triggered by a caller workflow, the `github` context is always associated with the caller workflow."]

Read for the whole context, `github.event_name` in the called workflow is the event that started the caller; the page does not name `github.event_name` or any event separately.

## On a `pull_request` event, `GITHUB_SHA` is the last merge commit of the pull request's merge branch, not its head commit

**Verified at:** <https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows> — 2026-11-19
**Citation:** [docs-only-checks_2: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows — `pull_request`: "Note that `GITHUB_SHA` for this event is the last merge commit of the pull request merge branch. If you want to get the commit ID for the last commit to the head branch of the pull request, use `github.event.pull_request.head.sha` instead.", with `GITHUB_REF` `refs/pull/PULL_REQUEST_NUMBER/merge`]

The head commit is `github.event.pull_request.head.sha`.
