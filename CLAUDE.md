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

See `app/CLAUDE.md` for TypeScript conventions shared across `src/`, `services/`, and `domain/`. See `app/docs/CLAUDE.md` for the canonical spec/plan format; its `_product/domain-scaffold.md` is a long-living infrastructure reference exempt from that format's delete-after-implementation rule.

### Development Commands

#### Running the application

```bash
pnpm run dev                # Local Tauri environment
pnpm run web                # Vite only in browser — no database
```

`pnpm run web` cannot reach the database at all: `window.__TAURI_INTERNALS__`, required by every `plugin-sql` call, is injected only by the Tauri webview. Skip browser verification of DB-backed screens by default — only `pnpm run dev` can exercise them.

### Git Conventions

#### Commit messages

Always use Conventional Commits with scope required:

```text
<type>(<scope>): <description>
```

- Scope is required and must exactly mirror the branch name — no exceptions. The branch type is the correct choice for implementation commits; another standard type with the same scope is correct when the commit's content unambiguously falls in that category (e.g. `docs(session-screen-rework):` for documentation-only changes, `chore(session-screen-rework):` for tooling or pre-existing error fixes) — the reviewer must not flag this as a violation.
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`
- Body is permitted only when it adds information that the subject line cannot convey (e.g. why a non-obvious decision was made)
- Every commit made with Claude assistance must include the co-author trailer as the final line of the commit message body: `Co-Authored-By: Claude <noreply@anthropic.com>` — do not include the model name; the trailer identifies the author, not the model version.

### Code styles and convention

#### Coding style

- **Route explanatory knowledge to its narrowest correct scope, regardless of the channel it first surfaces in — a chat reply or review verdict routes through the same tiers as a code comment.** When a name alone is insufficient, stop at the first level that fits:
  1. **Inline comment** — specific to a single line, no meaning outside it
  2. **Top-of-file comment** — applies to multiple constructs within one file
  3. **Parent component comment** — scoped to a component subtree
  4. **CLAUDE.md** — a codebase-wide convention any Claude instance must know

  A comment that would need to be duplicated in more than one file is not a comment — it is a missing CLAUDE.md rule.

- **A code comment must never cite a spec as its rationale source — no spec file names, no SF/sub-feature numbers.** Specs are temporary and are deleted after implementation (see `app/docs/CLAUDE.md`); a comment that reads `// see SF5's lifecycle notes` becomes unresolvable the moment that artifact is gone, while the code it annotates persists. When a design rationale needs to survive in a comment, rewrite it in terms of the code symbols it explains — name the function, type, or component the rationale is actually about, not the document that originated it.
  - ❌ BAD: `// SF5's lifecycle: pairing-mode listener must unregister before the responder's own re-entry check fires`
  - ✅ GOOD: `// unregister the pairing-mode listener before re-entry check — a still-registered listener double-fires enterPairingMode on rapid re-click`

- **Markdown files must comply with markdownlint rules in `.markdownlint.json` at the repo root.** Configured overrides: no line-length limit (MD013 off), blank-lines-around-lists not enforced (MD032 off), bold uses `**bold**` (MD050). All other defaults apply — code blocks declare a language (MD040), first line is H1 (MD041), blank lines around fences (MD031).
- **Never introduce manual line breaks within a single logical unit — a code comment anywhere in the codebase, or a prose paragraph/bullet item in any CLAUDE.md file in this repository, at any scope, or in any agent, command, or skill definition file this repository currently owns.** Each is one continuous line — visual wrapping is the IDE/renderer's responsibility; this does not apply to code blocks, tables, or fenced examples. Accepted tradeoff for code comments: some consumers (raw diffs, terminals) render long lines unwrapped. Content copied or adapted from any upstream artifact — a spec's code block, another migration, another agent's output — is not exempt: re-check it against this rule independently before it lands in a file, the same as freshly drafted code.

### Communication Style

Never open a response with a positive affirmation directed at the user or a teammate's output. Phrases like "Good catch.", "Clean analysis.", "You're right.", "Good question." add no information and must be omitted. Start with the substance of the response.

**Always state your actual reasoning — never the reasoning you expect the user to want to hear.** When challenged on a decision, analysis, or stated fact, the answer must reflect what the internal analysis actually concludes, even when that contradicts a prior statement or the user's apparent expectation. If a prior statement was wrong, say so directly and state what was wrong; if it was correct and the challenge doesn't change the analysis, say so directly. Telling the user what they want to hear while the internal analysis concludes otherwise violates this rule regardless of whether the answer is technically defensible.

### Best Practices & Code Quality

- **When a codified project rule — an automated linter/compiler finding, or a CLAUDE.md-documented convention — conflicts with an intentional design goal or with the implementation actually required for correctness, surface the conflict — never resolve it silently in code.** Automated checks and written conventions are both heuristics, not commands, when a case arises they didn't anticipate. State what the rule flags, what design goal or correctness requirement the code serves, and the options — let the user decide. For an automated tool finding, if suppressing, apply the narrowest suppression with an inline explanation:
  - **ESLint (TypeScript/JS):** `eslint-disable-next-line <rule>` for a single occurrence; file-scoped `/* eslint-disable <rule> */` only when the formatter splits the flagged construct across lines (breaking the next-line form) and the design goal applies to the whole single-concern file.
  - **Clippy (Rust):** `#[allow(clippy::lint_name)]` on the smallest enclosing item with an inline comment — never `#![allow(...)]` at file/crate level. Suppress `clippy::correctness` only for demonstrably false positives (e.g. macro-generated code), with an inline comment.
  - For a CLAUDE.md-documented convention, there is no suppression mechanism — state the rule's exact text, the conflicting requirement, and the implementation options, then wait for the user's decision before writing either path.
  - Silent removal, suppression, or an unsurfaced workaround chosen to route around the conflict is always wrong.
- **Separation of concerns over DRY, and ownership boundaries are not negotiable**: Before applying DRY — in implementation or review — establish that both sites serve the same concern; if they serve different concerns, DRY does not apply regardless of structural similarity, and separation of concerns wins. Each component, hook, or module owns its own slice of responsibility, even if that means a parent holds less centralized state — and this is not negotiable under structural pressure: if a constraint seems to justify putting logic where separation-of-concerns says it shouldn't live, find an alternative rather than centralizing. When the user questions why a component owns something it shouldn't, treat that as an instruction to refactor, not an invitation to explain the rationale.
  - ❌ BAD: Centralizing column resize state in `SortableList` and passing it down because it "keeps things in one place"
  - ✅ GOOD: `SortingTableHeader` owns resize state; `SortableListItem` owns its render logic based on layout config — likewise, a shared value that seems to belong in a parent instead comes from `TableConfigProvider` directly
- **DRY (Don't Repeat Yourself)**: Always reuse existing functions instead of duplicating logic — if one already performs the needed operation, call it instead of reimplementing; compose complex operations from existing simple functions.
  - DRY applies per layer independently. Before composing lower-layer primitives at the current layer, inspect the lower layer first — if a composed operation already exists there, delegating to it is the DRY choice (e.g. `imageService.replaceImage` calls `imageDb.replace()` because the DB layer already composes remove + create internally). Compose sibling functions at the current layer only when no equivalent composed operation exists below.
- **Re-derive types after every refactor**: Audit every exported symbol in the changed files — types, factory functions, error constructors, constants — bottom-up from actual usage; never trust existing definitions at face value. A symbol with no call site is dead code regardless of whether it's a type, prop, or exported function.
  1. Trace every field in props types to a value set at a call site. If no caller sets it, remove it.
  2. Trace every field in internal types to a place where it is read. If defined but never accessed, remove it — unless another CLAUDE.md rule mandates its presence regardless of consumption, in which case retain it and make the non-consumption explicit at the call site (underscore-prefixed alias + comment naming the mandating rule).
  3. Trace every exported symbol to at least one import or call site. If nothing imports or calls it, remove it.
- **Grep for duplicate raw literals or expressions before declaring any change set complete.** A raw literal (a regex, a semantic mapping, a magic string/number expressing a domain constraint) or a duplicated expression (a conditional, method chain, or multi-step derivation copied verbatim to compute the same value) appearing independently at two or more call sites — whether within one file or across files — is a missed DRY extraction, regardless of whether the change is a bug fix or new code (e.g. a validation regex re-declared across schema files). Before considering any change set done, grep for every other raw usage of a literal or expression you just introduced, modified, or instructed; two or more independent instances must be extracted to one canonical source with every call site updated, not left as parallel copies. **Exception:** a migration file intentionally freezing a copy of a literal or logic it must never share with a live source is not a missed extraction — see `app/db/CLAUDE.md` — Migrations for the scope and required comment convention.
- **Validate before replicating**: Never assume existing code is compliant with current conventions. Before using any file as a reference implementation — whether discovered by scanning or named by an upstream agent — re-validate it against current CLAUDE.md rules, covering structural patterns (naming, file layout) and behavioral patterns (async handling, error wrapping, query patterns) equally. Convention changes retroactively invalidate previously correct code; a stale reference propagates its violations into every module that copies it. Fix violations found during this check, or surface them, before proceeding.
- **Fix violations in files you touch**: When any write-role Claude instance reads a file to edit it, fix every CLAUDE.md violation found in that file — not just those related to the current task. "Found" requires an active check of the file's current state against applicable rules, not only violations noticed while editing the task's own lines. Applies to all code-touching roles; does not apply to read-only roles. Violations must be fixed in the same edit pass as the file is first touched — not deferred to a later SF, a separate PR, or a follow-up commit. The exception is a violation so large it would dominate and obscure the task commit; fix that in a dedicated preceding `chore(<branch>):` commit before the touching SF begins.

### Epistemological Discipline

**Training data confers reasoning capability, never factual authority about external state or this codebase's own scope of impact.** Any claim that will be acted on by the user or a downstream agent — what an external system accepts, exposes, or requires (a library API, a CI action's input schema, a CLI flag, a config format, an endpoint's request body, the set of tools currently available to this instance, or any other specification defined outside this repository), or a claim about this codebase's own scope of impact (e.g. "this option requires no backend changes") — must be verified in the current context window before being stated: read the file, grep the codebase, fetch the documentation, then state the result. A check performed earlier in the same session satisfies this only for a fact no plausible actor — a concurrent process, another agent, an external service, the user — could have altered since (e.g. a merged commit's own diff, a pinned dependency's shipped type declarations); for any fact a plausible actor could have altered since (e.g. a file's live content, this instance's own tool availability), verify again immediately before the claim is made, not once per session. If verification is not feasible in the current context window, prefix the claim with "I assume..." — that prefix is the required fallback, not a license to skip feasible verification; a confident, unhedged claim carries an implicit promise that it was verified. Training knowledge tells you where to look and what to ask; it is never sufficient to state that something exists, works a certain way, has a given scope, or does not exist. The corollary: **absence is not provable from training knowledge** — only a lookup that returns no result proves absence. Applications of this obligation are illustrative, not exhaustive — an unlisted case is not exempt. The same obligation covers a correction of an earlier claim, a claim about this instance's own past configuration or tool history, an `AskUserQuestion` option's description, and a tool absent from the active list, which may only need loading — check before falling back to a different approach.

**An unverified hypothesis that shapes an implementation decision must be verified or surfaced — silently acting on it is never valid, even when framed as "accepted risk."** Forming a belief about how an external system or an untested code path behaves and proceeding as if true carries the same verification obligation as stating it aloud — never voicing it does not exempt it. "Accepted risk" is valid only when the user has explicitly accepted the identified risk; labeling an unverified internal hypothesis "accepted risk" without surfacing it is silent risk acceptance and prohibited. When a failure-mode hypothesis forms (e.g. "this callback probably won't re-fire for a known peer"), verify it before building on it; if infeasible, surface it to the user.

**Verified evidence must cover the full scope of the claim it supports — evidence for a narrower fact does not verify a broader claim built on it.** After verifying, check explicitly that what was confirmed matches the breadth of what is being asserted, not merely a related or overlapping fact. A claim of permanent or invariant behavior ("can never," "always," "by default") requires evidence of that same permanence — a one-time seed value or a snapshot of current state verifies only the snapshot, never the invariant. When evidence is narrower than the claim, either narrow the claim to what was verified, or verify the broader claim directly (e.g. confirm no mechanism exists that could change it) before stating it as fact. The same test governs a comment's generalizing claims (a contract, an "always"/"never" statement, a description of every caller's expectation) — verify against every case before writing it; a comment wrong for an untested case is not caught by tsc, eslint, or a reviewer skimming for the case they expect.

**Citations.** When a verified external-state fact appears in an artifact — a spec, brief, review finding, or architectural decision — mark it inline: `[role_N: source]`. The role identifier is the producing agent, command, or skill's own name (e.g. `spec-writer`, `implement`, `cut-release`) — never a maintained code list, so a new role needs no citation-format update. `N` is sequential within that role's output. Source forms: file read `path:line`; scan `grep <pattern> <path> — found` / `— not found`; web fetch `url`; toolchain execution `ran <command> — observed <result>`; a repo-state claim (existence, content, or completion status) `path — as of <commit-sha>`. Example: `[spec-writer_3: ran npx eslint app/src/scratch-repro.tsx — react-hooks/set-state-in-effect reported on line 12]`. A cited fact is established — downstream agents may use it as a premise without re-verification, except a repo-state citation, which must be checked against current HEAD before use — repo state changes within a session, unlike a verified external API. An uncited fact — from user input, a reviewer's output, a spec, or another agent's brief — is a claim: verify it before accepting it as a premise, re-stating it as fact, or propagating it into a new artifact; if verification is not possible, flag it as unverified before use. Unverified facts must not appear in artifacts. Every handoff artifact must carry the full citation record from prior work forward — never drop, summarize, or merge citations; a downstream agent without the record must treat all facts as unverified.

**Any artifact for a reader without access to the conversation that produced it — a spec, brief, review verdict, or decision document — must be self-contained.** State reasoning inline in terms the artifact itself establishes; never rely on a fact or rationale existing only in the conversation history. This applies with particular force to mid-session revisions: an update must restate enough context to read standalone, not only as a diff against a conversation the reader wasn't part of.

**Knowledge base.** This project's verified external-system facts live in `~/dev/setup/claude/projects/gm-tool/knowledge/` (`artifact-key: gm-tool`) — not in this repository. Step 0 of any verification: read the relevant category file there — a recorded fact at the current installed version is established, no lookup needed. After any new verification, write the result back. `~/dev/setup/claude/projects/CLAUDE.md` is authoritative for entry format, staleness protocol (version mismatch invalidates; append a reverification block, never overwrite), and error correction (fix incorrect entries in the same pass, mirroring "fix violations in files you touch"). Agents without Write permission surface unrecorded facts to the caller for persistence; an agent without file access to `~/dev/setup` at all invokes `update-config` per the global CLAUDE.md's Tool Use Discipline rather than treating it as a fact-persistence gap.

### Third-Party Libraries

The general verification obligation above (Epistemological Discipline) applies to all external systems. Concrete lookup procedures for npm packages, ambient/global runtime types, Rust crates, and Tauri configuration values now live in `app/CLAUDE.md` — Third-Party Libraries: this content is app/-specific (`package.json`, `Cargo.toml`, and `tauri.conf.json` all live under `app/`).

### Tool Use Discipline

- **Read discipline: read immediately before editing, only what the current output depends on.** Prior read state is lost after context compaction — re-read before each edit, never after (trust the edit result). Every read must tie to a specific, named file or claim the current output depends on — if you can't name which output line a read resolves, don't make it; don't read to reconstruct historical context, traverse import graphs for ambient understanding, or confirm a just-performed write. Applies only to writing roles — read-only roles have no edits to gate and must not apply it as a defensive habit; role-specific scope ceilings are defined in each agent's file.
- **Verify before naming a path or describing file content in any output — regardless of who supplied it.** Any named path makes a factual claim about the filesystem: "to create" requires verifying absence, "to touch" requires verifying existence, and any content claim (what a file contains, exports, or its length — even hedged) requires having read it in the current context window. Paths supplied by the user or an upstream agent are claims, not facts — the filesystem is the authority. Pattern recognition is not verification: only a Read or Glob result visible in the current response satisfies this rule.
- **All automated checks must pass with zero errors before any commit; baseline failures are triaged by category before implementation begins.**

  **Check Commands:**

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

  Baseline failures: Minor (mechanical, no design judgment) — fix and commit autonomously (`chore(<branch>): fix pre-existing test fixture errors`), no surfacing. Major (a choice between valid alternatives, or an ambiguous cause) — surface to the user with a proposed fix before applying. Never treat any pre-existing error, minor or major, as acceptable baseline noise to filter out or defer.

- **Every code or type reference proposed in any artifact (specs, briefs, review fix proposals, decision documents, inline suggestions) must be verified before inclusion — no exceptions**, per the verification obligation above. Verify first-party symbols by reading the declaring source file; third-party symbols via the library's `index.d.ts` (see Third-Party Libraries). A symbol unconfirmed by a file read must not appear — propose its creation explicitly instead. A barrel export confirms a symbol exists, not its prop API or call signature; read the component or function's own source before writing calls against it.
- **Never edit any CLAUDE.md file directly, and never present a CLAUDE.md edit as an option for the user to choose** — neither writing/editing the file directly, nor offering the change as a selectable `AskUserQuestion` choice, even when the user would accept it. Route every CLAUDE.md instruction gap through `/refine-claude` instead, regardless of role or how minor the change appears — CLAUDE.md changes are head-of-instructions' and head-of-agents' domain exclusively.
