# /refine-claude proposals — pnpm CLAUDE.md sync

Mode: Retrospective (pasted-text input, no cycle-directory pre-gate).
Trigger: npm→pnpm package-manager migration (commit bf7cd2f, branch
claude/package-manager-evaluation-f2hbfg) left stale `npm`-era command
references in files the migration commit could not touch directly
(CLAUDE.md files) or missed during its edit pass (two files outside
CLAUDE.md scope).

## Phase 1 — Diagnosis

| ID | Root cause | Class | Owner |
| --- | --- | --- | --- |
| F1 | Root `CLAUDE.md`'s Development Commands section (code block + prose) still shows `npm run dev` / `npm run web`, stale since the migration changed the invocation prefix. | Mechanical drift — not a CLAUDE.md-instruction gap; no reasoning process was wrong, a factual claim simply went stale. | head-of-instructions |
| F2 | `.claude/CLAUDE.md`'s cut-release registry entry (Output and Constraints fields) still says `npm run create-release`, stale for the same reason, now inconsistent with the already-updated `.claude/skills/cut-release/SKILL.md`. | Mechanical drift, same class as F1. | head-of-instructions |
| F3 | `.claude/commands/implement.md:78` still says `npm test`, two lines above an already-migrated `pnpm run build:frontend` in the same section. | Mechanical drift — migration's edit pass was non-exhaustive over a file it could edit directly (no CLAUDE.md routing excuse). | head-of-agents |
| F4 | `.claude/agents/spec-writer.md:100` still says `package-lock.json` / `npm install` (twice in the same sentence) for lockfile-regeneration guidance. | Mechanical drift, same class as F3. | head-of-agents |

Shared root cause: F1–F4 all trace to the same completed migration's edit
pass not reaching every `npm`-referencing location — F1/F2 because
CLAUDE.md files require this `/refine-claude` routing rather than direct
edit; F3/F4 because the pass simply missed them despite being directly
editable.

Both teammates concluded, on direct instruction to consider it, that no
generalizable rule should be extracted here: this is a one-time factual
sync following a discrete, non-recurring event (a specific migration
commit), not a systemic gap in either file's instructional content. No
structural or behavioral rule is proposed as a result — the direct
correction is the complete fix for this root cause.

## Phase 2 — Proposals

### head-of-instructions — F1

```text
File: /home/user/gm-tool/CLAUDE.md
Type: REPLACE
Section: Development Commands

Old:
npm run dev                # Local Tauri environment
npm run web                # Vite only in browser — no database

`npm run web` cannot reach the database at all: `window.__TAURI_INTERNALS__`, required by every `plugin-sql` call, is injected only by the Tauri webview. Skip browser verification of DB-backed screens by default — only `npm run dev` can exercise them.

New:
pnpm run dev                # Local Tauri environment
pnpm run web                # Vite only in browser — no database

`pnpm run web` cannot reach the database at all: `window.__TAURI_INTERNALS__`, required by every `plugin-sql` call, is injected only by the Tauri webview. Skip browser verification of DB-backed screens by default — only `pnpm run dev` can exercise them.

Why: package-manager migration changed the invocation prefix from `npm run`
to `pnpm run`; script names ("dev", "web") are unchanged — literal token
sync, not a convention change.
```

### head-of-instructions — F2 (includes the Constraints-field occurrence found during the fresh re-read)

```text
File: /home/user/gm-tool/.claude/CLAUDE.md
Type: REPLACE
Section: cut-release

Old:
Output: A local `chore(release):` commit with version bumps and CHANGELOG entries; instructions to run `npm run create-release` to push and trigger CI
Constraints: Never runs `npm run create-release` itself; always confirms the target version and shows the full diff before committing; a commit message that doesn't parse into a recognized conventional-commit type is never silently classified — the user is asked

New:
Output: A local `chore(release):` commit with version bumps and CHANGELOG entries; instructions to run `pnpm run create-release` to push and trigger CI
Constraints: Never runs `pnpm run create-release` itself; always confirms the target version and shows the full diff before committing; a commit message that doesn't parse into a recognized conventional-commit type is never silently classified — the user is asked

Why: same migration; brings the registry entry back in sync with the
already-updated .claude/skills/cut-release/SKILL.md, fixing both stale
occurrences (Output and Constraints) in one pass.
```

### head-of-agents — F3

```text
File: /home/user/gm-tool/.claude/commands/implement.md
Type: REPLACE
Section: Post-loop

Old: Run `npm test` once more. Resolve any remaining errors. Implementation is complete when the user confirms the branch is ready.
New: Run `pnpm test` once more. Resolve any remaining errors. Implementation is complete when the user confirms the branch is ready.

Why: closes F3 — stale npm-era reference inconsistent with the very next
line in the same section, which already uses pnpm; `pnpm test` invokes the
same unchanged `test` script in app/package.json.
```

### head-of-agents — F4 (includes the second package-lock.json occurrence in the same sentence)

```text
File: /home/user/gm-tool/.claude/agents/spec-writer.md
Type: REPLACE
Section: (sub-feature detail rules — "Package manifest consequences")

Old:    **Package manifest consequences**: When a sub-feature changes any `package.json` dependency, list `package-lock.json` under `Modified:` with a note that it is regenerated via `npm install` and needs no manual authoring. When a sub-feature's Rust behavior contracts (async primitives, timeouts, stream handling, or any capability not covered by a directly-named crate) imply a crate the spec has not listed, trace the contract to its implementing crate and add it to `Cargo.toml` under `Modified:` — do not assume a wrapper crate (e.g. `tauri::async_runtime`) re-exports what its dependents need without verifying it against its docs.rs page for the installed version, per app/CLAUDE.md — Third-Party Libraries. List `Cargo.lock` under `Modified:` with the same regenerated-automatically note as `package-lock.json`.
New:    **Package manifest consequences**: When a sub-feature changes any `package.json` dependency, list `pnpm-lock.yaml` under `Modified:` with a note that it is regenerated via `pnpm install` and needs no manual authoring. When a sub-feature's Rust behavior contracts (async primitives, timeouts, stream handling, or any capability not covered by a directly-named crate) imply a crate the spec has not listed, trace the contract to its implementing crate and add it to `Cargo.toml` under `Modified:` — do not assume a wrapper crate (e.g. `tauri::async_runtime`) re-exports what its dependents need without verifying it against its docs.rs page for the installed version, per app/CLAUDE.md — Third-Party Libraries. List `Cargo.lock` under `Modified:` with the same regenerated-automatically note as `pnpm-lock.yaml`.

Why: closes F4 — corrects both stale artifacts (lockfile filename and
regenerating command) in the same sentence, matching app/package.json's
"packageManager": "pnpm@11.22.0".
```

## Proposal Quality Gate

- Criterion 1 (Causal depth): satisfied on the grounds established in
  Phase 1 — the identified root cause (a specific migration commit's
  non-exhaustive edit pass) is inherently non-recurring; no deeper
  structural or behavioral rule is available to extract beyond the direct
  correction, per both teammates' explicit determination when asked.
- Criterion 2 (Concreteness): both teammates re-read every target file
  fresh in Phase 2 before drafting; no proposal relies on the original
  excerpted text.
- Criteria 3, 5, 6, 7: not triggered — no "no change" verdicts, no
  ceiling-proximity reasoning, no ceiling-raise proposed.
- Criterion 4 (Application-code scope check): not triggered — no
  application-code change concluded by either teammate.
- Measurement discipline: not invoked — this is not a consolidation batch
  and no size/delta figure is presented to the user.

No contradictions between teammates; no domain overlap (F1/F2 exclusively
head-of-instructions' CLAUDE.md files, F3/F4 exclusively head-of-agents'
command/agent files).
