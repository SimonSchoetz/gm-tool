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

See `app/CLAUDE.md` for TypeScript conventions shared across `src/`, `services/`, and `domain/`. See `app/docs/CLAUDE.md` for this project's plan format extension, which the architect's brief and the implementer's plan record follow; its `_product/domain-scaffold.md` is a long-living infrastructure reference that is never deleted.

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
- **Re-derive types, trace procedure:**
  1. Trace every field in props types to a value set at a call site. If no caller sets it, remove it.
  2. Trace every field in internal types to a place where it is read. If defined but never accessed, remove it — unless another CLAUDE.md rule mandates its presence regardless of consumption, in which case retain it and make the non-consumption explicit at the call site (underscore-prefixed alias + comment naming the mandating rule).
  3. Trace every exported symbol to at least one import or call site. If nothing imports or calls it, remove it. The `lint` row's `local/no-unused-exports` does this for every export except those under `app/src-tauri/` and in the files `app/eslint.config.js` turns that rule off or relaxes it for; trace those by hand.
- **Migration-file exception:** A migration file intentionally freezing a copy of a literal or logic it must never share with a live source is not a missed extraction — see `app/db/CLAUDE.md` — Migrations for the scope and required comment convention.
- **Active check on touched files** — extends the shared rule Best Practices & Code Quality, "When editing a file for an unrelated task, fix convention violations": in this repository, noticing means an active check of the file's current state against every applicable convention, not only violations seen while editing the task's own lines. Fix them in the same edit pass; a violation large enough to obscure the task goes in a dedicated preceding `chore(<branch>):` commit.

### Epistemological Discipline

**Citations.** When a verified external-state fact appears in an artifact — a story, brief, review finding, or architectural decision — mark it inline: `[role_N: source]`. The role identifier is the producing agent, command, or skill's own name (e.g. `cut-release`, or whichever role produced the fact). `N` is sequential within that role's output in the producing session; ids need not be unique across a store, because the source inside the bracket identifies the check. Source forms: file read `path:line`; scan `grep <pattern> <path> — found` / `— not found`; web fetch `url`; toolchain execution `ran <command> — observed <result>`; a repo-state claim (existence, content, or completion status) `path — as of <commit-sha>`. Write each path, command and pattern inside the source in backticks, so a name such as `__tests__` never renders as emphasis. Example: ``[cut-release_3: ran `npx eslint app/src/scratch-repro.tsx` — react-hooks/set-state-in-effect reported on line 12]``. A cited fact is established — downstream agents may use it as a premise without re-verification, except a repo-state citation, which must be checked against current HEAD before use — repo state changes within a session, unlike a verified external API. An uncited fact — from user input, a reviewer's output, a story, or another agent's brief — is a claim: verify it before accepting it as a premise, re-stating it as fact, or propagating it into a new artifact; if verification is not possible, flag it as unverified before use. Unverified facts must not appear in artifacts. Every handoff artifact must carry the full citation record from prior work forward — never drop, summarize, or merge citations (a knowledge-store entry is not a handoff artifact: its `Citation` line follows `.claude/knowledge/CLAUDE.md`); a downstream agent without the record must treat all facts as unverified.

**Knowledge base.** This project's verified external-system facts live in `.claude/knowledge/`, tracked in this repository, one file per external system (`tauri.md`, `tanstack-query.md`, …). Step 0 of any verification: grep the `##` headings of the relevant file there — each heading states its entry's current fact — and read the matching entry; a recorded fact at the current installed version is established, no lookup needed. After any new verification, write the result back in the entry shape, with the citation, split and refresh rules, given in `.claude/knowledge/CLAUDE.md`, which loads when a file in that directory is read — read it before writing a new entry. Agents without Write permission surface unrecorded facts to the caller for persistence.

### Tool Use Discipline

- **Check Commands:**

  | Key                 | Invocation                                           | Working directory | Cadence         | Trigger                                                            |
  | ------------------- | ---------------------------------------------------- | ----------------- | --------------- | ------------------------------------------------------------------ |
  | `type-check`        | `npx tsc --noEmit && npx tsc --noEmit -p ../scripts` | `app/`            | every check     | always                                                             |
  | `lint`              | `npx eslint . ../scripts`                            | `app/`            | every check     | always                                                             |
  | `format-check`      | `npx prettier --check . ../scripts`                  | `app/`            | every check     | always                                                             |
  | `markdown-lint`     | `pnpm run markdown-lint`                             | repository root   | every check     | when a `*.md` path is touched                                      |
  | `css-token-check`   | `node scripts/css-token-check.ts`                    | repository root   | every check     | when an `app/src/**/*.css` file is touched                         |
  | `test`              | `npx vitest run`                                     | `app/`            | full-suite-only | always                                                             |
  | `rust-lint`         | `cargo clippy --all-targets -- -D warnings`          | `app/src-tauri/`  | every check     | when `app/src-tauri/` is touched                                   |
  | `rust-format-check` | `cargo fmt --check`                                  | `app/src-tauri/`  | every check     | when `app/src-tauri/` is touched                                   |
  | `rust-test`         | `cargo test`                                         | `app/src-tauri/`  | full-suite-only | when `app/src-tauri/` is touched                                   |
  | `mutation-check`    | `pnpm run mutation-check`                            | repository root   | full-suite-only | when a file under `app/` or a `scripts/mutation-*` file is touched |

  Between sub-features, run every row whose `Trigger` condition holds and whose `Cadence` is `every check`, each from its own `Working directory`. The full suite — every row whose `Trigger` condition holds, regardless of `Cadence` — runs at the start of a session (baseline). `mutation-check` also runs by hand before the final review cycle, and again after the fixes made in that cycle; a run without arguments is the gate and must exit zero. A report lists every survivor and timeout: resolve all of them, then re-run only the files that had one with `pnpm run mutation-check -- <file>…` (the printed path without its `:line:column`; an `--all` audit re-runs with `--all` too) until they exit zero, and finish with a run without arguments. Its scope, arguments, `--accept` and `--accept-hang` (a timeout) are in the header of `scripts/mutation-check.ts`. Each survivor it prints is resolved by a test that fails on that mutation, or, only when no input observes a difference, by an entry in `scripts/mutation-accepted.json` — never by a `Stryker disable` comment. An entry's reason states in plain words why no test can observe the change; where a code comment at that statement already states the invariant, the reason is `the code comment at this statement states why no test can observe this change`. A branch that changes Rust needs `cargo install --locked cargo-mutants`; its survivors go in `scripts/mutation-accepted-rust.json`. The `../scripts/<file>` entries record a one-off audit no later run mutates. Run `--accept` last; edit differing reasons in the file afterwards. After the final review cycle, no row is run by hand before committing, because the hooks run every other row: at commit through `.githooks/staged-checks`, which `pre-commit` and `pre-merge-commit` call, and at push through `pre-push`; the `simple-git-hooks` block of the `package.json` beside this file and that script hold which rows run, over which files, and under which staged-path conditions. A table `markdown-lint` reports under MD060 is re-aligned by `pnpm run markdown-fix` from the repository root, which re-runs the lint and exits with its status; never align one by hand. This departs from Tool Use Discipline, "Run the project's own check suite": the rows in the `pre-push` entry of `package.json` run whole-project at push, not before each commit.

  The `check` job in `.github/workflows/release.yml` runs every row of the table except `mutation-check`, regardless of its `Trigger`, before any release build — a release tag sits on `main`, so `mutation-check` would find no changed file to mutate — in steps named by the rows' keys with each row's invocation and working directory. A change to the table — a row added, removed, or given another invocation or working directory — needs the same change to that job's steps.

  **Build Command:** `pnpm run build:frontend`, from `app/`.

  **Package Manager:** `pnpm` — lockfile `pnpm-lock.yaml`, regenerated via `pnpm install`. A fresh git worktree has neither `node_modules` nor the gitignored `app/src/routeTree.gen.ts`: before its first commit run `pnpm install` at the repository root and in `app/`, and copy `app/src/routeTree.gen.ts` from the main checkout, or the `pre-commit` hook fails (`tsc` missing, then route type errors).

  **Baseline failures — Minor/Major triage:** Minor (mechanical, no design judgment) — fix and commit autonomously (`chore(<branch>): fix pre-existing test fixture errors`), no surfacing. Major (a choice between valid alternatives, or an ambiguous cause) — surface to the user with a proposed fix before applying.

- **Third-party type references:** verify via the library's `index.d.ts` (see `app/CLAUDE.md` — Third-Party Libraries). A barrel export confirms a symbol exists, not its prop API or call signature; read the component or function's own source before writing calls against it.
- **Instruction files are never edited as a side effect of another task.** Any `CLAUDE.md` in this repository, anything under `.claude/rules/`, and `.claude/gimbal.md` change only in a dedicated instruction pass: a refine session whose whole task is the instruction files, or a correction by a feature run's lead as the next paragraph of this bullet defines it. The maintainer approves the batch of a refine session they run themselves. The maintainer's standing delegation: the session they started a refine session from approves that refine session's batch for the items it names, within the scope a feature run's lead approves, a change the user would feel in behaviour or data and any security change excepted. A feature run's lead approves the batch of the refine session that lead started. That approval is the written permission the shared Action Authorization rule yields to, and it covers only that batch's edits. Such an edit is never offered as a choice mid-task, even when the user would accept it. State the instruction gap in the session's output and leave the change to a refine session.

  A feature run's lead may itself correct a statement of fact in these files that is untrue at HEAD — it names a symbol, path, location or check that the repository at HEAD does not match, whether a merged commit changed it or the sentence never matched — when the correction changes nothing an agent must do and meets every further condition the lead's process sets for it. This paragraph is the written permission the shared Action Authorization rule yields to for such a correction and only for one that meets every condition here: it needs no asking and covers that correction's commit on the lead's branch, never a push. The correction is a commit that holds no other change, and its body cites, for each changed reference, the file and line at HEAD that show the new fact, and the merged commit's sha where a commit made the sentence untrue. It may name a check from this section's table, or a rule that check's configuration enables, only where the sentence already states what that check enforces, so the naming adds nothing an agent must do. Where the code departs from what a sentence requires, the sentence is not corrected to match: that, and any change that adds, removes or alters an obligation, prohibition, default, exception or scope, deletes a rule, or rewords or shortens a rationale, is not a correction and goes to a refine session.
