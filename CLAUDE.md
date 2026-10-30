# CLAUDE.md

## Archive (`_archive/`)

Contains an old web project which was more of a playground. It should be ignored by Claude unless stated otherwise.

## App (`app/`)

Project to build the app I want for my personal use without constraints like accessibility concerns.

### Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **Database**: SQLite
- **Styling**: IBM Plex Sans (UI) / IBM Plex Mono (code) — self-hosted `@fontsource` webfonts, see `typography-variables.css`

### App Structure (`app/`)

```text
app/
├── CLAUDE.md
├── db/          # SQLite database
│   └── CLAUDE.md
├── dev-data-server/  # Node dev tooling: web-mode data server, dev data mirror
│   └── CLAUDE.md
├── docs/        # planning docs
│   └── CLAUDE.md
├── domain/      # application vocabulary layer (errors, types, validation)
│   └── CLAUDE.md
├── platform/    # host boundary: every Tauri call goes through @platform
├── public/      # static assets
├── services/    # business logic layer
│   └── CLAUDE.md
├── src/         # React frontend source
│   └── CLAUDE.md
├── src-tauri/   # Rust backend (Tauri)
│   └── CLAUDE.md
└── util/
```

See `app/CLAUDE.md` for TypeScript conventions shared across `src/`, `services/`, and `domain/`. See `app/docs/CLAUDE.md` for this project's spec-format extension; its `_product/domain-scaffold.md` is a long-living infrastructure reference that is never deleted with a spec.

### Development Commands

#### Running the application

```bash
pnpm run dev                # Local Tauri environment
pnpm run web                # Vite in a browser, on a temporary copy of the dev app's data
pnpm run web:seed           # Vite in a browser, on a fresh database filled by the dev seed
```

`pnpm run web` and `pnpm run web:seed` reach the database through the dev data server (`app/dev-data-server/CLAUDE.md`), so a session verifies UI acceptance criteria in the browser pane (`app/docs/features/web-dev-mode.md`). It verifies on the seeded mode (`pnpm run web:seed`, the `seeded-web` launch configuration), whose data is the same at every start and whose entities the Seeded mode table in that file names; `pnpm run web` serves a copy of the developer's own dev data, for a check that needs it. What needs the native host — the native file dialog, sync between devices, the updater, the backup — stays a hand test in the Tauri app. `pnpm run dev` first offers to replace the dev app's data with a copy of the installed app's data — unasked only when the dev app has no database; a session that starts it without a terminal keeps the dev data (`app/docs/features/dev-data-mirror.md`).

### Communication Style

Never open a response with a positive affirmation directed at the user or a teammate's output. Phrases like "Good catch.", "Clean analysis.", "You're right.", "Good question." add no information and must be omitted. Start with the substance of the response.

### Best Practices & Code Quality

- **Suppression syntax when the shared Best Practices & Code Quality linter-conflict rule applies:**
  - **ESLint (TypeScript/JS):** `eslint-disable-next-line <rule>` for a single occurrence; file-scoped `/* eslint-disable <rule> */` only when the formatter splits the flagged construct across lines (breaking the next-line form) and the design goal applies to the whole single-concern file.
  - **Clippy (Rust):** `#[allow(clippy::lint_name)]` on the smallest enclosing item with an inline comment — never `#![allow(...)]` at file/crate level. Suppress `clippy::correctness` only for demonstrably false positives (e.g. macro-generated code), with an inline comment.
- **Separation-of-concerns example:**
  - ❌ BAD: Centralizing column resize state in `SortableList` and passing it down because it "keeps things in one place"
  - ✅ GOOD: `SortingTableHeader` owns resize state; `SortableListItem` owns its render logic based on layout config — likewise, a shared value that seems to belong in a parent instead comes from `TableConfigProvider` directly
- **DRY per layer example** (shared Best Practices & Code Quality rule "Reuse existing functions…"): `imageService.replaceImage` calls `imageDb.replace()` because the DB layer already offers image replacement as one operation, so the service delegates instead of composing sibling functions.
- **Re-derive types, trace procedure:**
  1. Trace every field in props types to a value set at a call site. If no caller sets it, remove it.
  2. Trace every field in internal types to a place where it is read. If defined but never accessed, remove it — unless another CLAUDE.md rule mandates its presence regardless of consumption, in which case retain it and make the non-consumption explicit at the call site (underscore-prefixed alias + comment naming the mandating rule).
  3. Trace every exported symbol to at least one import or call site. If nothing imports or calls it, remove it. The `lint` row's `local/no-unused-exports` does this for every export except those under `app/src-tauri/` and in the files `app/eslint.config.js` turns that rule off or relaxes it for, and the rule counts an import from a test file as a use (it indexes every source file of the program), so an export imported only by tests passes it; trace those by hand.
- **Migration-file exception:** A migration file intentionally freezing a copy of a literal or logic it must never share with a live source is not a missed extraction — see `app/db/CLAUDE.md` — Migrations for the scope and required comment convention.
- **Active check on touched files** — extends the shared rule Best Practices & Code Quality, "When editing a file for an unrelated task, fix convention violations": in this repository, noticing means an active check of the file's current state against every applicable convention, not only violations seen while editing the task's own lines. Fix them in the same edit pass; a violation large enough to obscure the task goes in a dedicated preceding `chore(<branch>):` commit.

### Epistemological Discipline

**Citations.** When a verified external-state fact appears in an artifact — a spec, brief, review finding, or architectural decision — mark it inline: `[role_N: source]`. The role identifier is the producing agent, command, or skill's own name (e.g. `cut-release`, or whichever role produced the fact). `N` is sequential within that role's output in the producing session; ids need not be unique across a store, because the source inside the bracket identifies the check. Source forms: file read `path:line`; scan `grep <pattern> <path> — found` / `— not found`; web fetch `url`; toolchain execution `ran <command> — observed <result>`; a repo-state claim (existence, content, or completion status) `path — as of <commit-sha>`. Write each path, command and pattern inside the source in backticks, so a name such as `__tests__` never renders as emphasis. Example: ``[cut-release_3: ran `npx eslint app/src/scratch-repro.tsx` — react-hooks/set-state-in-effect reported on line 12]``. A cited fact is established — downstream agents may use it as a premise without re-verification, except a repo-state citation, which must be checked against current HEAD before use — repo state changes within a session, unlike a verified external API. An uncited fact — from user input, a reviewer's output, a spec, or another agent's brief — is a claim: verify it before accepting it as a premise, re-stating it as fact, or propagating it into a new artifact; if verification is not possible, flag it as unverified before use. Unverified facts must not appear in artifacts. Every handoff artifact must carry the full citation record from prior work forward — never drop, summarize, or merge citations (a knowledge-store entry is not a handoff artifact: its `Citation` line follows `.claude/knowledge/CLAUDE.md`); a downstream agent without the record must treat all facts as unverified.

**Knowledge base.** This project's verified external-system facts live in `.claude/knowledge/`, tracked in this repository, one file per external system (`tauri.md`, `tanstack-query.md`, …). Step 0 of any verification: grep the `##` headings of the relevant file there — each heading states its entry's current fact — and read the matching entry; a recorded fact at the current installed version is established, no lookup needed. After any new verification, write the result back in the entry shape, with the citation, split and refresh rules, given in `.claude/knowledge/CLAUDE.md`, which loads when a file in that directory is read — read it before writing a new entry. Agents without Write permission surface unrecorded facts to the caller for persistence.

### Third-Party Libraries

The shared Epistemological Discipline rule beginning "Training data confers reasoning capability..." applies to all external systems. Lookup procedures for npm packages and ambient/global runtime types live in `app/CLAUDE.md` — Third-Party Libraries; for Rust crates and Tauri configuration values, in `app/src-tauri/CLAUDE.md` — Third-Party Libraries.

### Tool Use Discipline

- **Check Commands:**

  | Key                 | Invocation                                  | Working directory | Cadence         | Trigger                             |
  | ------------------- | ------------------------------------------- | ----------------- | --------------- | ----------------------------------- |
  | `type-check`        | `npx tsc --noEmit`                          | `app/`            | every check     | always                              |
  | `lint`              | `npx eslint .`                              | `app/`            | every check     | always                              |
  | `format-check`      | `npx prettier --check .`                    | `app/`            | every check     | always                              |
  | `markdown-lint`     | `pnpm run markdown-lint`                    | repository root   | every check     | when a `*.md` path is touched       |
  | `test`              | `npx vitest run`                            | `app/`            | full-suite-only | always                              |
  | `rust-lint`         | `cargo clippy --all-targets -- -D warnings` | `app/src-tauri/`  | every check     | when `app/src-tauri/` is touched    |
  | `rust-format-check` | `cargo fmt --check`                         | `app/src-tauri/`  | every check     | when `app/src-tauri/` is touched    |
  | `rust-test`         | `cargo test`                                | `app/src-tauri/`  | full-suite-only | when `app/src-tauri/` is touched    |
  | `mutation-check`    | `pnpm run mutation-check`                   | repository root   | full-suite-only | when a file under `app/` is touched |

  `Cadence: every check` runs both between sub-features and as part of the full suite; `full-suite-only` runs only as part of the full suite. Between sub-features, run every row whose `Trigger` condition holds and whose `Cadence` is `every check`, each from its own `Working directory`. The full suite — every row whose `Trigger` condition holds, regardless of `Cadence` — runs at the start of a session (baseline). `mutation-check` also runs by hand before the final review cycle, and again after the fixes made in that cycle; a run without arguments is the gate and must exit zero. A report lists every survivor at once: resolve all of them, then re-run only the files that had survivors with `pnpm run mutation-check -- <file>…` (the printed path without its `:line:column`) until they exit zero, and finish with a run without arguments. No git hook runs it. Its scope and arguments are in the header of `scripts/mutation-check.ts`. Each survivor it prints is resolved by a test that fails on that mutation; a `// Stryker disable next-line <mutator>: <reason>` comment above the line is for a mutant whose reason can state why no input observes a difference from the original (`.claude/knowledge/stryker.md`). A disable comment also ignores the mutants of that mutator on the line that the tests already kill, so where it would hide one, rewrite the line to a form with the same behaviour that generates no equivalent mutant instead. Where a comment reaches, and what it silences, is recorded as observed in `.claude/knowledge/stryker.md`. After the final review cycle, no row is run by hand before committing, because the `simple-git-hooks` block of the `package.json` beside this file runs every other row: `pre-commit` and `pre-merge-commit` run `markdown-lint` when a staged path ends in `.md`, then `type-check`, `lint` and `format-check` when a staged path is under `app/`, then `rust-lint` and `rust-format-check` when a staged path is under `app/src-tauri/`; `pre-push` runs `test`, then `rust-test`, on every push. A failing row rejects the commit or the push. A table `markdown-lint` reports under MD060 is re-aligned by `pnpm run markdown-fix` from the repository root, which re-runs the lint and exits with its status; never align one by hand. For `test` and `rust-test`, this departs from Tool Use Discipline, "Run the project's own check suite": they run at push, not before each commit.

  The `check` job in `.github/workflows/release.yml` runs every row of the table except `mutation-check`, regardless of its `Trigger`, before any release build — a release tag sits on `main`, so `mutation-check` would find no changed file to mutate — in steps named by the rows' keys with each row's invocation and working directory. A change to the table — a row added, removed, or given another invocation or working directory — needs the same change to that job's steps.

  **Build Command:** `pnpm run build:frontend`, from `app/`.

  **Package Manager:** `pnpm` — lockfile `pnpm-lock.yaml`, regenerated via `pnpm install`.

  **Baseline failures — Minor/Major triage:** Minor (mechanical, no design judgment) — fix and commit autonomously (`chore(<branch>): fix pre-existing test fixture errors`), no surfacing. Major (a choice between valid alternatives, or an ambiguous cause) — surface to the user with a proposed fix before applying.

- **Third-party type references:** verify via the library's `index.d.ts` (see Third-Party Libraries). A barrel export confirms a symbol exists, not its prop API or call signature; read the component or function's own source before writing calls against it.
- **Instruction files are never edited as a side effect of another task.** Any `CLAUDE.md` in this repository, anything under `.claude/rules/`, and `.claude/gimbal.md` change only in a dedicated instruction pass: a refine session whose whole task is the instruction files. The maintainer approves the batch of a refine session they run themselves; a feature run's lead approves the batch of the refine session that lead started. That approval is the written permission the shared Action Authorization rule yields to, and it covers only that batch's edits. Such an edit is never offered as a choice mid-task, even when the user would accept it. State the instruction gap in the session's output and leave the change to that pass.
