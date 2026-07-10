# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo

This is a mono repo containing all projects regarding the GM-Tool project. So far it contains:

- `_archive/`
- `app/`

## Archive (`_archive/`)

Contains an old web project which was more of a playground. It should be ignored by Claude unless stated otherwise.

## App (`app/`)

Project to build the app I want for my personal use without constraints like accessibility concerns.

### Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **Database**: SQLite
- **Styling**: TBD

### App Structure (`app/`)

```text
app/
├── CLAUDE.md
├── db/          # SQLite database
│   └── CLAUDE.md
├── docs/        # planning docs — see app/docs/CLAUDE.md
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

See `app/CLAUDE.md` for TypeScript conventions shared across `src/`, `services/`, and `domain/`.

### Development Commands

#### Running the application

```bash
npm run dev                # Local Tauri environment
npm run web                # Vite only in browser
```

### Git Conventions

#### Branch naming

Always use `<type>/<branch-name>` format:

- `feat/session-screen-rework`
- `refactor/tanstack-query`
- `fix/session-name-nullable`

#### Commit messages

Always use Conventional Commits with scope required:

```
<type>(<scope>): <description>
```

- Scope is required and must exactly mirror the branch name — no exceptions. The branch type is the correct choice for implementation commits; another standard type with the same scope is correct when the commit's content unambiguously falls in that category (e.g. `docs(session-screen-rework):` for documentation-only changes, `chore(session-screen-rework):` for tooling or pre-existing error fixes) — the reviewer must not flag this as a violation.
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`
- Body is permitted only when it adds information that the subject line cannot convey (e.g. why a non-obvious decision was made)
- Every commit made with Claude assistance must include the co-author trailer as the final line of the commit message body: `Co-Authored-By: Claude <noreply@anthropic.com>` — do not include the model name; the trailer identifies the author, not the model version.

### Code styles and convention

#### Coding style

- Use descriptive names instead of comments
  ❌ BAD: `const data = await fetch(); // Get user data`
  ✅ GOOD: `const userData = await fetchUserData();`
- **Route explanatory knowledge to its narrowest correct scope.** When a name alone is insufficient, stop at the first level that fits:
  1. **Inline comment** — specific to a single line, no meaning outside it
  2. **Top-of-file comment** — applies to multiple constructs within one file
  3. **Parent component comment** — scoped to a component subtree
  4. **CLAUDE.md** — a codebase-wide convention any Claude instance must know

  A comment that would need to be duplicated in more than one file is not a comment — it is a missing CLAUDE.md rule.

- **Markdown files must comply with markdownlint rules as defined in `.markdownlint.json` at the repo root.** Key configured rules: no line-length limit (MD013 off), blank-lines-around-lists not enforced (MD032 off), bold uses asterisk style `**bold**` (MD050). All other markdownlint defaults apply — code blocks must declare a language (MD040), first line must be H1 (MD041), blank lines around fences (MD031).
- **Never introduce manual line breaks in prose paragraphs or bullet list items in instruction files** (`.claude/agents/*.md`, `.claude/commands/*.md`, and all CLAUDE.md files) **or in code comments anywhere in the codebase.** Each paragraph, each bullet item, and each comment is one continuous line — visual wrapping is the IDE/renderer's responsibility. This does not apply to code blocks, tables, or fenced examples. For code comments this is an accepted tradeoff: some consumers (raw diffs, terminals) render them unwrapped.
- **When a file is moved or promoted to a new location, update all consumers to import from the new location — never introduce a re-export in the old barrel solely to preserve existing import paths.** A backward-compat re-export hides the migration and leaves consumers pointing at a stale path through an indirection layer — imports must reflect where symbols actually live.
  - ❌ BAD: Adding `export { getDateTimeString } from '@util/getDateTimeString'` to `src/util/index.ts` so existing callers do not need updating
  - ✅ GOOD: Remove the barrel re-export; update every consumer to import from the new location directly

### Accountability on Missed Requirements

When caught having missed a rule, a test, a cleanup item, or anything that CLAUDE.md or project conventions required, do not stop at acknowledging the miss. On the first pushback — before being asked again — immediately provide all four of the following:

1. **Which rule applies** — cite it exactly, state why it is not scoped to a subset of cases (i.e., why it applied here), and identify its source: explicit instruction in CLAUDE.md, inferred from project conventions, inferred from examples, or derived from general principles.
2. **Why it was missed** — not what was wrong in the output, but what went wrong in the reasoning process that produced the miss.
3. **The wrong mental model** — the assumption or shortcut that caused the reasoning to fail.
4. **The correct mental model** — the replacement belief or check that would have caught it.

The first pushback is the prompt. If the source in point 1 is anything other than explicit instruction in CLAUDE.md, flag it: "This rule is not yet written down explicitly — consider adding it to CLAUDE.md."

### Immediate Application of Corrections

When a conversation surfaces a corrected understanding of a rule, convention, or approach — via user correction, retrospective discussion, or independent self-diagnosis — apply the corrected version for the remainder of the current session immediately, without waiting for CLAUDE.md to be edited or a new instance to read the change. The correction is binding the moment it is reached, not the moment it is written down. Do not revert to the prior, now-known-wrong approach later in the same session, and do not wait to be told again before applying it to the next applicable decision. Accountability on Missed Requirements governs explaining what went wrong; this rule governs behaving differently starting immediately after.

### Communication Style

Never open a response with a positive affirmation directed at the user or a teammate's output. Phrases like "Good catch.", "Clean analysis.", "You're right.", "Good question." add no information and must be omitted. Start with the substance of the response.

**Always state your actual reasoning — never the reasoning you expect the user to want to hear.** When challenged on a decision, an analysis, or a stated fact, the answer must reflect what the internal analysis actually concludes, even when that conclusion contradicts a prior statement or the user's apparent expectation. If a prior statement was wrong, say so directly and state what was wrong about it; if it was correct and the challenge does not change the analysis, say so directly. Telling the user what they want to hear while the internal analysis concludes otherwise violates this rule regardless of whether the answer is technically defensible.

### Best Practices & Code Quality

- **When the user opts for an approach that conflicts with documented best practices or is flagged as inadvisable by the relevant framework or library authors, push back explicitly before implementing.** Do not assume the user's choice is informed — surface the concern and confirm it is intentional. One explicit pushback is required; if the user confirms, implement as asked.
- **When a linter or compiler finding conflicts with an intentional design goal, surface the conflict — never comply silently.** Automated checks are heuristics, not commands. State what the rule flags, what design goal the code serves, and what the options are — let the user decide. If the decision is to suppress, apply the narrowest suppression with an inline explanation of why:
  - **ESLint (TypeScript/JS):** Prefer `eslint-disable-next-line <rule>` for a single occurrence. When the formatter splits the flagged construct across lines and the next-line comment would land wrong, file-scoped `/* eslint-disable <rule> */` is the narrowest valid alternative — but only in a single-concern file where the design goal applies to the whole file.
  - **Clippy (Rust):** Prefer `#[allow(clippy::lint_name)]` on the smallest enclosing item, with an inline comment explaining why. Never use `#![allow(...)]` at file or crate level. Only suppress `clippy::correctness` lints for demonstrably false positives (e.g. macro-generated code), with an inline comment explaining why.
  - Silent removal or silent suppression without surfacing the conflict is always wrong.
- **Missing required tests are never out of scope.** When any Claude instance — in any role — encounters a missing test that is required by rule or established convention, it must add the test, regardless of the primary task or role. Piece-by-piece closure is correct — do not batch, defer, or escalate missing tests as a separate task unless the test gap is so large it would dominate the current PR.
- **Separation of concerns over DRY**: Before applying DRY — in implementation or review — establish that both sites serve the same concern. If they serve different concerns, DRY does not apply regardless of structural similarity. When the two conflict, always prefer separation of concerns. Each component, hook, or module owns its own slice of responsibility — even if that means a parent holds less centralized state.
  - ❌ BAD: Centralizing column resize state in `SortableList` and passing it down because it "keeps things in one place"
  - ✅ GOOD: `SortingTableHeader` owns resize state; `SortableListItem` owns its render logic based on layout config
- **Ownership boundaries are not negotiable**: If a structural constraint seems to justify putting logic in a component that the separation-of-concerns rules say should not own it, find an alternative — do not centralise, and do not defend the decision if challenged. When the user questions why a component owns something it shouldn't, treat that as an instruction to refactor, not an invitation to explain the rationale (e.g. instead of a shared value in the parent, have both children read from `TableConfigProvider` directly).
- **Context value types must contain only what external consumers call through the hook.** A function called exclusively inside the provider's own module belongs in local scope, not on the `ContextValue` type — placing provider-internal functions there widens the public interface beyond what consumers need and obscures which operations are genuinely external.
- **DRY (Don't Repeat Yourself)**: Always reuse existing functions instead of duplicating logic
  - If a function already exists that performs the needed operation, call it instead of reimplementing
  - Compose complex operations from existing simple functions
  - DRY applies per layer independently. Before composing lower-layer primitives at the current layer, inspect the lower layer first — if a composed operation already exists there, delegating to it is the DRY choice (e.g. `imageService.replaceImage` calls `imageDb.replace()` because the DB layer already composes remove + create internally). Compose sibling functions at the current layer only when no equivalent composed operation exists below.
- **Re-derive types after every refactor**: After any refactor, audit every exported symbol in the changed files — types, factory functions, error constructors, constants — bottom-up from actual usage. Never trust existing definitions at face value. A symbol with no call site is dead code regardless of whether it is a type, a prop, or an exported function.
  1. Trace every field in props types to a value being set at a call site. If no caller sets it, remove it.
  2. Trace every field in internal types to a place where it is read. If a field is defined but never accessed, remove it.
  3. Trace every exported symbol to at least one import or call site in the codebase. If nothing imports or calls it, remove it.
- **Grep all call sites before declaring a semantic-mapping fix complete.** When a bug fix touches a semantic mapping expressed as raw literals (e.g. a direction-to-axis or key-to-value table), grep for every other raw usage of that same mapping before considering the fix done — fixing the reported call site does not fix the duplicates. Two or more independent raw-literal instances of the same mapping are themselves a missed DRY extraction: extract the mapping to one canonical source and update every call site, rather than patching each instance. (Distinct from "Re-derive types" above: that audits exported symbols for dead code after a refactor; this verifies bug-fix completeness across raw-literal duplicates that were never extracted.)
- **Validate before replicating**: Never assume existing code is compliant with current conventions. Before using any file as a reference implementation — whether discovered by scanning or named by an upstream agent — re-validate it against current CLAUDE.md rules, covering structural patterns (naming, file layout) and behavioral patterns (async handling, error wrapping, query patterns) equally. Convention changes retroactively invalidate previously correct code; a stale reference propagates its violations into every module that copies it. Fix violations found during this check, or surface them, before proceeding.
- **Fix violations in files you touch**: When any write-role Claude instance reads a file to edit it, fix every CLAUDE.md violation found in that file — not just those related to the current task. Applies to all code-touching roles; does not apply to read-only roles. Violations must be fixed in the same edit pass as the file is first touched — not deferred to a later SF, a separate PR, or a follow-up commit. The exception is a violation so large it would dominate and obscure the task commit; fix that in a dedicated preceding `chore(<branch>):` commit before the touching SF begins.
- **Prefer surgical edits over write-from-scratch.** When a task can be accomplished by modifying existing files, evaluate the surgical edit path first. Write from scratch only when the existing content has nothing worth keeping — not because the task is framed as a "rewrite" or because generating fresh content feels faster. Applies to all file types: code, specs, and configuration alike.

### Epistemological Discipline

**Training data confers reasoning capability, never factual authority about external state.** Any claim about what an external system accepts, exposes, or requires — a library API, a CI action's input schema, a CLI flag, a config format, an endpoint's request body, the set of tools currently available to this instance, or any other specification defined outside this repository — must be verified in the current context window before being stated. Training knowledge tells you where to look and what to ask; it is never sufficient to state that something exists, works a certain way, or does not exist. The corollary: **absence is not provable from training knowledge** — only a lookup that returns no result proves absence.

**In conversational output, verify before stating — and hedge when you cannot.** Perform the verification first (read the file, grep the codebase, fetch the documentation), then state the result. If verification is not feasible in the current context window, prefix the claim with "I assume..." — that prefix is the required fallback, not a license to skip feasible verification. A confident, unhedged claim carries an implicit promise that it was verified.

**Citations.** When a verified external-state fact appears in an artifact — a spec, brief, review finding, or architectural decision — mark it inline: `[Role_N: source]`. Role codes: `R` = code-reviewer, `A` = architect, `S` = spec-writer, `I` = implementer; `N` sequential within that agent's output. Source forms: file read `path:line`; scan `grep <pattern> <path> — found` / `— not found`; web fetch `url`; toolchain execution `ran <command> — observed <result>`. Example: `[S_3: ran npx eslint app/src/scratch-repro.tsx — react-hooks/set-state-in-effect reported on line 12]`.

**A fact's epistemic status is determined by its citation.** A cited fact is established — downstream agents may use it as a premise without re-verification. An uncited fact — from user input, a reviewer's output, a spec, or another agent's brief — is a claim: verify it before accepting it as a premise, re-stating it as fact, or propagating it into a new artifact; if verification is not possible, flag it as unverified before use. Unverified facts must not appear in artifacts. Every handoff artifact must carry the full citation record from prior work forward — never drop, summarize, or merge citations; a downstream agent without the record must treat all facts as unverified.

**When an external system misbehaves, read its documentation before proposing any diagnosis.** This is a pre-proposal gate: the documentation read happens before the first stated cause, not after fix attempts. Assuming the existing configuration is complete and correct — and jumping to environment, credentials, versions, or runtime state — is the failure mode this rule closes.

**Knowledge base.** `.claude/knowledge/` caches verified external-system facts by category file (e.g. `tauri.md`, `lexical.md`). Step 0 of any verification: read the relevant category file — a recorded fact at the current installed version is established, no lookup needed. After any new verification, write the result back. `.claude/knowledge/CLAUDE.md` is authoritative for the entry format, staleness protocol (version mismatch invalidates; append a reverification block, never overwrite), and error correction (fix incorrect entries in the same pass, mirroring "fix violations in files you touch"). Agents without Write permission surface unrecorded facts to the caller for persistence.

### Third-Party Libraries

The general verification obligation above applies to all external systems. For **npm packages specifically**, the lookup procedure is:

1. Check the installed version in `package.json`
2. Fetch the official documentation for that exact version from the internet
3. If documentation is ambiguous or unavailable, ask before proceeding

This applies especially to: TanStack Query, TanStack Router, Lexical, Tauri, and Drizzle.

To inspect what a library actually exports, use Read or Glob on its `index.d.ts` (e.g. `node_modules/<package>/dist/index.d.ts`). Never use `node -e` or any runtime introspection — type declarations are the authoritative source and require no execution.

For **Tauri configuration values** (`tauri.conf.json` and related config files): locate the `$schema` field (e.g. `"$schema": "https://schema.tauri.app/config/2"`), fetch the JSON schema at that URL, and read the accepted enum strings directly from the schema — never infer them from prose documentation, which may use colloquial language that does not match the schema's declared values.

### Tool Use Discipline

- **Always Read a file immediately before editing it — a pre-edit gate, not a general reading habit.** Treat prior read state as lost after context compaction; re-read before each edit. Do not re-read a file after editing it to verify the write — trust the edit result. Applies only to writing roles; read-only roles have no edits to gate and must not apply it as a defensive habit.
- **Read scope is minimum viable.** Every read must be tied to a specific, named file or claim that the current output depends on. If you cannot state which output line the read is resolving before making it, do not make it. Do not read files to reconstruct historical context, traverse import graphs for ambient understanding, or confirm a write you just performed. Role-specific scope ceilings are defined in each agent's file.
- **Verify before naming a path or describing file content in any output — regardless of who supplied it.** Any path named in output makes a factual claim about the filesystem: "to create" requires verifying absence, "to touch" requires verifying existence, and any content claim (what a file contains, exports, or how long it is — even hedged) requires having read it in the current context window. Paths supplied by the user or an upstream agent are claims, not facts — the filesystem is the authority. Pattern recognition is not verification: only a Read or Glob result visible in the current response satisfies this rule.
- **Verify import paths resolve from the importer's location and use the correct form.** Resolve the path from the file that will contain the import — not from a feature root — and confirm it reaches a specific file, not a directory. A path whose last two segments repeat the same name (`ComponentName/ComponentName`) is the double-name anti-pattern: use the barrel when one exists; when no barrel exists and a grouping barrel would be circular, the explicit file path is the only valid form and is correct.
- **All automated checks must pass with zero errors or failures before any commit.** Between sub-features during implementation, run `npx tsc --noEmit`, `npx eslint .`, and `prettier --check .` — vitest produces noise from intentionally incomplete intermediate states at sub-feature boundaries and is the only check deferred. The full TypeScript suite (tsc + vitest + eslint + prettier) runs twice per session: at the start (baseline) and after the final review cycle concludes (before committing). When any `src-tauri/` file is touched, the Rust suite (clippy + fmt-check) also runs at both points. Pre-existing failures must be resolved before implementation begins — never filtered out, deferred, or treated as acceptable baseline noise. Checks and their invocations:
  - Type check: `npx tsc --noEmit` (from `app/`)
  - Tests: `npx vitest run` (from `app/`)
  - Lint: `npx eslint .` (from `app/`)
  - Format: `prettier --check .` (from `app/`)
  - Rust lint (when `src-tauri/` files are touched): `cargo clippy -- -D warnings` (from `app/src-tauri/`)
  - Rust format check (when `src-tauri/` files are touched): `cargo fmt --check` (from `app/src-tauri/`)
- **Pre-existing errors discovered during the baseline check fall into two categories.** Minor — mechanical to fix and requiring no design judgment: fix and commit autonomously (`chore(<branch>): fix pre-existing test fixture errors`) without surfacing. Major — requiring a choice between valid alternatives, or with a cause ambiguous from the error output alone: surface to the user with a proposed fix before applying. Never treat any pre-existing error as acceptable baseline noise.
- **Every code or type reference proposed in any artifact must be verified before inclusion — no exceptions.** Artifacts include specs, briefs, review fix proposals, decision documents, and inline suggestions. Verify first-party symbols by reading the declaring source file; third-party symbols via the library's `index.d.ts` (see Third-Party Libraries). A symbol that cannot be confirmed by a file read must not appear in the artifact — propose its creation explicitly instead. A barrel export confirms a symbol exists — not its prop API or call signature; read the component or function's own source before writing calls against it.
- **Before placing a hook call in any component — in artifact code or implementation — verify the component renders below every provider the hook depends on.** Reading the component file is not sufficient — trace its position in the provider tree, and re-trace after any extraction or move.
- **Code in any artifact must be valid under the project's full toolchain configuration, not just type-declaration correct.** Verify against the active `app/tsconfig.json` compiler flags and `app/eslint.config.js` plugin rules before writing code that depends on them. Three error classes pass symbol verification but fail at toolchain time: (1) tsc narrowing mechanics — tsc narrows variables, not re-evaluated call expressions; store the result in a `const` before the guard; (2) strictness flags — e.g. `exactOptionalPropertyTypes` rejects assigning `T | undefined` to an optional property typed `T`; (3) ESLint plugin rules — e.g. `react-hooks/refs` bans reading `ref.current` inside a render callback. Training knowledge of what TypeScript or ESLint permits in the abstract is never sufficient.
- **Never prefix git commands with `cd`.** The working directory is set correctly by Claude Code's process context; `cd /path && git ...` does not match `Bash(git *)` permissions and causes unnecessary prompts — issue git commands directly.
- **Never stage by directory path — always enumerate files explicitly.** Name every file individually: `git add <file1> <file2> ...` — never `git add <directory>/`. A directory path silently skips sibling files at adjacent levels that belong to the same logical change. When a commit spans multiple directory levels, build the file list explicitly before running `git add`.
- **Verify the teammate-spawning mechanism against the live tool registry before asserting how it works.** One-shot workers exit after a single result and cannot be resumed; long-running teammates persist and are addressable by name. A tool absent from the active list may need loading (e.g. via a tool-search mechanism) rather than being gone — check which before falling back to a different approach. Full teammate lifecycle rules live in `.claude/commands/refine-claude.md`, the only command that spawns persistent teammates. Never silently substitute a fresh instance for an existing teammate — surface the continuity loss explicitly.
- **Push back when a user instruction is technically impossible.** If an instruction cannot work due to system mechanics (e.g. messaging an agent that has already exited, calling an API that does not exist), do not execute it silently. State what makes it impossible and propose the correct alternative — user instructions are authoritative for intent; correct the mechanism while preserving the intent.
- **After context compaction, the user's live message outranks the session-state summary.** A summary describes what was in progress — it is not an instruction to continue. Read the user's first message in the new window first; when it redirects away from the described pending task, act on the live message and do not resume the pending task.
- **Never edit any CLAUDE.md file directly, and never present a CLAUDE.md edit as an option for the user to choose.** This covers both mechanisms: (1) writing or editing a CLAUDE.md file directly, and (2) offering a CLAUDE.md change as a selectable choice via `AskUserQuestion` or any other choice-construction — even when the user would be the one to accept it. Route every CLAUDE.md instruction gap through `/refine-claude` instead, regardless of role or how minor the change appears — CLAUDE.md changes are head-of-instructions' and head-of-agents' domain exclusively.
- **When a missing permission causes or would cause friction, invoke `update-config` immediately — do not describe the fix and defer.** This applies when the user explicitly requests a permission change, and equally when Claude itself diagnoses that a missing permission is blocking or will block ongoing work — in the latter case invoke the skill proactively; surfacing it as a suggestion and leaving it as "a separate decision" is not acceptable.

#### File Organization

- **1 concern → 1 file**: A concern is defined by domain ownership, not operation type or access shape. Everything that belongs to the same domain entity belongs in the same file or module — splitting by singular/plural query, or by read/write, fragments cohesion without benefit.
  - ✅ GOOD: `create.ts`, `get.ts`, `remove.ts` at the DB layer — each is an independent public operation on a different concern (creation vs. retrieval vs. deletion)
  - ✅ GOOD: `allTermsMatchItem.ts` containing private `getSearchableText` and `termMatchesItem` — they exist only to support `allTermsMatchItem`
  - ❌ BAD: `utils.ts` with unrelated helpers dumped together
- **Tests mirror file structure**: Test files live in a `__tests__/` subdirectory next to the code they test
  - Source: `helper/parseSearchTerms.ts` → Test: `helper/__tests__/parseSearchTerms.test.ts`
- Error handling: see `app/src/CLAUDE.md` — State Management & Error Handling

## Product

### Domain Glossary

Entity vocabulary grounded in the actual database schema (`app/db/*/schema.ts`). Every entity below is scoped to a single Adventure via `adventure_id` unless noted otherwise.

| Term | Meaning |
| --- | --- |
| Adventure | Top-level campaign container. Owns all other entities. |
| Session | A single game session within an Adventure. Tracks `active_view` (`prep` or `ingame`) and owns an ordered set of Session Steps. |
| Session Step | One prep checklist item within a Session, keyed to Michael Shea's Lazy Dungeon Master steps: reviewing characters, a strong start, potential scenes, secrets and clues, fantastic locations, important NPCs, relevant monsters, magic items. |
| NPC (non-player character) | A character controlled by the GM. |
| PC (player character) | A character controlled by a player. |
| Foe | An antagonist or monster. |
| Faction | An organization or group within the Adventure's world. |
| Location | A place within the Adventure's world. |
| Item | An object — e.g. equipment or a magic item — within the Adventure. |
| Image | A shared asset referenced by `image_id` across Adventures, NPCs, PCs, Foes, Factions, Locations, and Items. |
| Table Config | Shared infrastructure controlling per-table display settings (color, tagging, scope, layout). Not a narrative entity. |
