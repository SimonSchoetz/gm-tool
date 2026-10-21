# markdownlint

## markdownlint-cli2 0.23.3 globs with `dot: true`, so `**/*.md` lints files under `.claude/` and `.github/` without a glob of their own

**Verified at:** markdownlint-cli2 0.23.3 — 2026-10-21
**Citation:** [refine-1-follow-ups_1: `node_modules/markdownlint-cli2/markdownlint-cli2.mjs:457-466` — `enumerateFiles` passes `"dot": true` to `globby`] [refine-1-follow-ups_2: ran `npx markdownlint-cli2 "**/*.md" "#**/node_modules" "#_archive" "#app/src-tauri/target" "#app/src-tauri/vendor" "#.claude/worktrees"` at the repository root — observed findings in `.claude/knowledge/fonts.md` and `.claude/skills/cut-release/SKILL.md`; ran the same globs with a probe file `.github/zz-probe.md` holding one line of text — observed `.github/zz-probe.md:1 error MD041/first-line-heading/first-line-h1`]

A dot-directory that must not be linted needs a `#`-negated glob.

## A markdownlint-cli2 `#`-negated glob without `**/` excludes only the directory at the base directory, not a nested one of the same name

**Verified at:** markdownlint-cli2 0.23.3 — 2026-10-21
**Citation:** [refine-1-follow-ups_3: ran `npx markdownlint-cli2 "**/*.md" "#node_modules"` and the same with `"#**/node_modules"` at the repository root, where `app/node_modules` exists — observed `Linting: 2169 files` with `app/node_modules` paths in the findings, and `Linting: 91 files` with none]

`#**/node_modules` excluded `app/node_modules` as well as the root one.

## markdownlint-cli2 0.24.0 was published 2026-10-21 06:59 UTC, the release after 0.23.3 of 2026-09-20

**Verified at:** npm registry — 2026-10-21
**Citation:** [refine-1-follow-ups_4: ran `npm view markdownlint-cli2 version time --json` — observed `0.24.0` as `version`, and the three newest entries of `time` `0.23.2` at `2026-07-27T05:24:05.433Z`, `0.23.3` at `2026-09-20T04:44:38.259Z`, `0.24.0` at `2026-10-21T06:59:51.013Z`]

pnpm's minimum release age (`.claude/knowledge/pnpm.md`) refuses 0.24.0 until that long after its publication.
