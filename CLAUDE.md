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
├── docs/        # planning docs
│   └── CLAUDE.md
├── domain/      # application vocabulary layer (errors, types, validation)
│   └── CLAUDE.md
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
pnpm run web                # Vite only in browser — no database
```

`pnpm run web` cannot reach the database at all: `window.__TAURI_INTERNALS__`, required by every `plugin-sql` call, is injected only by the Tauri webview. Skip browser verification of DB-backed screens by default — only `pnpm run dev` can exercise them.

### Code styles and convention

#### Coding style

- **Markdown files must comply with markdownlint rules in `.markdownlint.json` at the repo root.** Configured overrides: no line-length limit (MD013 off), blank-lines-around-lists not enforced (MD032 off), bold uses `**bold**` (MD050). All other defaults apply — code blocks declare a language (MD040), first line is H1 (MD041), blank lines around fences (MD031).

### Communication Style

Never open a response with a positive affirmation directed at the user or a teammate's output. Phrases like "Good catch.", "Clean analysis.", "You're right.", "Good question." add no information and must be omitted. Start with the substance of the response.

### Best Practices & Code Quality

- **Suppression syntax when the shared Best Practices & Code Quality linter-conflict rule applies:**
  - **ESLint (TypeScript/JS):** `eslint-disable-next-line <rule>` for a single occurrence; file-scoped `/* eslint-disable <rule> */` only when the formatter splits the flagged construct across lines (breaking the next-line form) and the design goal applies to the whole single-concern file.
  - **Clippy (Rust):** `#[allow(clippy::lint_name)]` on the smallest enclosing item with an inline comment — never `#![allow(...)]` at file/crate level. Suppress `clippy::correctness` only for demonstrably false positives (e.g. macro-generated code), with an inline comment.
- **Separation-of-concerns example:**
  - ❌ BAD: Centralizing column resize state in `SortableList` and passing it down because it "keeps things in one place"
  - ✅ GOOD: `SortingTableHeader` owns resize state; `SortableListItem` owns its render logic based on layout config — likewise, a shared value that seems to belong in a parent instead comes from `TableConfigProvider` directly
- **DRY per layer:** Before composing lower-layer primitives at the current layer, inspect the lower layer first — if a composed operation already exists there, delegating to it is the DRY choice (e.g. `imageService.replaceImage` calls `imageDb.replace()` because the DB layer already composes remove + create internally). Compose sibling functions at the current layer only when no equivalent composed operation exists below.
- **Re-derive types, trace procedure:**
  1. Trace every field in props types to a value set at a call site. If no caller sets it, remove it.
  2. Trace every field in internal types to a place where it is read. If defined but never accessed, remove it — unless another CLAUDE.md rule mandates its presence regardless of consumption, in which case retain it and make the non-consumption explicit at the call site (underscore-prefixed alias + comment naming the mandating rule).
  3. Trace every exported symbol to at least one import or call site. If nothing imports or calls it, remove it.
- **Migration-file exception:** A migration file intentionally freezing a copy of a literal or logic it must never share with a live source is not a missed extraction — see `app/db/CLAUDE.md` — Migrations for the scope and required comment convention.
- **Active check on touched files** — extends the shared rule Best Practices & Code Quality, "When editing a file for an unrelated task, fix convention violations": in this repository, noticing means an active check of the file's current state against every applicable convention, not only violations seen while editing the task's own lines. Fix them in the same edit pass; a violation large enough to obscure the task goes in a dedicated preceding `chore(<branch>):` commit.

### Epistemological Discipline

**Citations.** When a verified external-state fact appears in an artifact — a spec, brief, review finding, or architectural decision — mark it inline: `[role_N: source]`. The role identifier is the producing agent, command, or skill's own name (e.g. `cut-release`, or whichever role produced the fact) — never a maintained code list, so a new role needs no citation-format update. `N` is sequential within that role's output. Source forms: file read `path:line`; scan `grep <pattern> <path> — found` / `— not found`; web fetch `url`; toolchain execution `ran <command> — observed <result>`; a repo-state claim (existence, content, or completion status) `path — as of <commit-sha>`. Example: `[cut-release_3: ran npx eslint app/src/scratch-repro.tsx — react-hooks/set-state-in-effect reported on line 12]`. A cited fact is established — downstream agents may use it as a premise without re-verification, except a repo-state citation, which must be checked against current HEAD before use — repo state changes within a session, unlike a verified external API. An uncited fact — from user input, a reviewer's output, a spec, or another agent's brief — is a claim: verify it before accepting it as a premise, re-stating it as fact, or propagating it into a new artifact; if verification is not possible, flag it as unverified before use. Unverified facts must not appear in artifacts. Every handoff artifact must carry the full citation record from prior work forward — never drop, summarize, or merge citations; a downstream agent without the record must treat all facts as unverified.

**Knowledge base.** This project's verified external-system facts live in `.claude/knowledge/`, tracked in this repository, one file per external system (`tauri.md`, `tanstack-query.md`, …). Step 0 of any verification: grep the `##` headings of the relevant file there — each heading states its entry's fact — and read the matching entry; a recorded fact at the current installed version is established, no lookup needed. After any new verification, write the result back as `## <declarative fact heading>`, then `**Verified at:** <version, or URL + date>`, `**Citation:** [role_N: source]`, and a one-to-three-sentence body. A version mismatch invalidates an entry: re-verify and append a `**Reverified at:**` block, never overwrite. Fix an incorrect entry in the same pass — the same convention that governs any other violation found in a touched file. Agents without Write permission surface unrecorded facts to the caller for persistence.

### Third-Party Libraries

The verification obligation stated in the shared rules file's Epistemological Discipline (the rule beginning "Training data confers reasoning capability...") applies to all external systems. Concrete lookup procedures for npm packages, ambient/global runtime types, Rust crates, and Tauri configuration values now live in `app/CLAUDE.md` — Third-Party Libraries: this content is app/-specific (`package.json`, `Cargo.toml`, and `tauri.conf.json` all live under `app/`).

### Tool Use Discipline

- **Check Commands:**

  | Key | Invocation | Working directory | Cadence | Trigger |
  | --- | --- | --- | --- | --- |
  | `type-check` | `npx tsc --noEmit` | `app/` | every check | always |
  | `lint` | `npx eslint .` | `app/` | every check | always |
  | `format-check` | `prettier --check .` | `app/` | every check | always |
  | `test` | `npx vitest run` | `app/` | full-suite-only | always |
  | `rust-lint` | `cargo clippy -- -D warnings` | `app/src-tauri/` | every check | when `app/src-tauri/` is touched |
  | `rust-format-check` | `cargo fmt --check` | `app/src-tauri/` | every check | when `app/src-tauri/` is touched |

  `Cadence: every check` runs both between sub-features and as part of the full suite; `full-suite-only` runs only as part of the full suite. Between sub-features, run every row whose `Trigger` condition holds and whose `Cadence` is `every check`, each from its own `Working directory`. The full suite — every row whose `Trigger` condition holds, regardless of `Cadence` — runs twice per session: at the start (baseline) and after the final review cycle, before committing.

  **Build Command:** `pnpm run build:frontend`, from `app/`.

  **Package Manager:** `pnpm` — lockfile `pnpm-lock.yaml`, regenerated via `pnpm install`.

  **Baseline failures — Minor/Major triage:** Minor (mechanical, no design judgment) — fix and commit autonomously (`chore(<branch>): fix pre-existing test fixture errors`), no surfacing. Major (a choice between valid alternatives, or an ambiguous cause) — surface to the user with a proposed fix before applying.

- **Third-party type references:** verify via the library's `index.d.ts` (see Third-Party Libraries). A barrel export confirms a symbol exists, not its prop API or call signature; read the component or function's own source before writing calls against it.
- **A convention whose firing condition is a file type or a cross-cutting pattern goes in `.claude/rules/` at the repository root, never in the nearest directory `CLAUDE.md`.** A directory file can only say "under this path", and it loads cumulatively with every ancestor, so a rule that fires on `*.css`, on `__tests__/`, or on any pattern a directory boundary does not express reaches every reader of that directory. A rule under `.claude/rules/` loads only when Claude reads or references a path matching its `paths` glob. Requirements for every file there: `paths` frontmatter is mandatory — a rule without it loads at launch and belongs in a `CLAUDE.md` instead; one artifact kind per file, named `<layer-root>-<artifact-kind>.md`; every glob written in both the `app/`-prefixed and the bare form, since which one the harness anchors against is not established; and every pointer into or out of such a rule written as a repository-root-relative path, because a reader following it may not have that rule loaded. This layout assumes sessions start at the repository root, where `.claude/` and this file live. If a rule that should apply never fires, check that assumption first, then whether the path actually read matched a glob.
- **Instruction files are never edited as a side effect of another task.** Any `CLAUDE.md` in this repository, anything under `.claude/rules/`, and `.claude/gimbal.md` change only in a dedicated instruction pass; such an edit is never offered as a choice mid-task, even when the user would accept it. State the instruction gap in the session's output and leave the change to the maintainer's dedicated instruction pass.
