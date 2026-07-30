# CLAUDE.md

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

- **A comment's factual claims must hold for every case it generalizes over, not just the case that motivated writing it.** A comment describing a function's contract, a component's behavior, or an invariant is a claim under Epistemological Discipline's verification obligation the same as any other stated fact — before writing a generalizing claim in a comment (a contract, an "always"/"never" statement, a description of every caller's expectation), verify it against every case it claims to cover, not only the one case currently in view. A comment wrong for an untested case is not caught by tsc, eslint, or a reviewer skimming for the case they expect.

- **A code comment must never cite a spec as its rationale source — no spec file names, no SF/sub-feature numbers.** Specs are temporary and are deleted after implementation (see `app/docs/CLAUDE.md`); a comment that reads `// see SF5's lifecycle notes` becomes unresolvable the moment that artifact is gone, while the code it annotates persists. When a design rationale needs to survive in a comment, rewrite it in terms of the code symbols it explains — name the function, type, or component the rationale is actually about, not the document that originated it.
  - ❌ BAD: `// SF5's lifecycle: pairing-mode listener must unregister before the responder's own re-entry check fires`
  - ✅ GOOD: `// unregister the pairing-mode listener before re-entry check — a still-registered listener double-fires enterPairingMode on rapid re-click`

- **Markdown files must comply with markdownlint rules in `.markdownlint.json` at the repo root.** Configured overrides: no line-length limit (MD013 off), blank-lines-around-lists not enforced (MD032 off), bold uses `**bold**` (MD050). All other defaults apply — code blocks declare a language (MD040), first line is H1 (MD041), blank lines around fences (MD031).
- **Never introduce manual line breaks within a single logical unit — a code comment anywhere in the codebase, or a prose paragraph/bullet item in an instruction file** (`.claude/agents/*.md`, `.claude/commands/*.md`, and all CLAUDE.md files). Each is one continuous line — visual wrapping is the IDE/renderer's responsibility; this does not apply to code blocks, tables, or fenced examples. Accepted tradeoff for code comments: some consumers (raw diffs, terminals) render long lines unwrapped. Content copied or adapted from any upstream artifact — a spec's code block, another migration, another agent's output — is not exempt: re-check it against this rule independently before it lands in a file, the same as freshly drafted code.

### Accountability on Missed Requirements

When caught having missed a rule, a test, a cleanup item, or anything CLAUDE.md or project conventions required, do not stop at acknowledging the miss — on the first pushback, before being asked again, provide all four:

1. **Which rule applies** — cite it exactly, state why it isn't scoped to a subset of cases (why it applied here), and identify its source: explicit CLAUDE.md instruction, inferred from project conventions, inferred from examples, or derived from general principles.
2. **Why it was missed** — not what was wrong in the output, but what went wrong in the reasoning process.
3. **The wrong mental model** — the assumption or shortcut that caused the failure.
4. **The correct mental model** — the replacement belief or check that would have caught it.

The first pushback is the prompt. If the source in point 1 is anything other than explicit CLAUDE.md instruction, flag it: "This rule is not yet written down explicitly — consider adding it to CLAUDE.md."

### Immediate Application of Corrections

When a conversation surfaces a corrected understanding of a rule, convention, or approach — via user correction, retrospective discussion, or independent self-diagnosis — apply the corrected version for the remainder of the current session immediately, without waiting for CLAUDE.md to be edited or a new instance to read the change. The correction is binding the moment it is reached, not the moment it is written down. Do not revert to the prior, now-known-wrong approach later in the same session, and do not wait to be told again before applying it to the next applicable decision. Accountability on Missed Requirements governs explaining what went wrong; this rule governs behaving differently starting immediately after.

### Communication Style

Never open a response with a positive affirmation directed at the user or a teammate's output. Phrases like "Good catch.", "Clean analysis.", "You're right.", "Good question." add no information and must be omitted. Start with the substance of the response.

**Always state your actual reasoning — never the reasoning you expect the user to want to hear.** When challenged on a decision, analysis, or stated fact, the answer must reflect what the internal analysis actually concludes, even when that contradicts a prior statement or the user's apparent expectation. If a prior statement was wrong, say so directly and state what was wrong; if it was correct and the challenge doesn't change the analysis, say so directly. Telling the user what they want to hear while the internal analysis concludes otherwise violates this rule regardless of whether the answer is technically defensible.

### Best Practices & Code Quality

- **When the user opts for an approach that conflicts with documented best practices or is flagged as inadvisable by the relevant framework or library authors, push back explicitly before implementing.** Do not assume the user's choice is informed — surface the concern and confirm it is intentional. One explicit pushback is required; if the user confirms, implement as asked.
- **When a linter or compiler finding conflicts with an intentional design goal, surface the conflict — never comply silently.** Automated checks are heuristics, not commands. State what the rule flags, what design goal the code serves, and the options — let the user decide. If suppressing, apply the narrowest suppression with an inline explanation:
  - **ESLint (TypeScript/JS):** `eslint-disable-next-line <rule>` for a single occurrence; file-scoped `/* eslint-disable <rule> */` only when the formatter splits the flagged construct across lines (breaking the next-line form) and the design goal applies to the whole single-concern file.
  - **Clippy (Rust):** `#[allow(clippy::lint_name)]` on the smallest enclosing item with an inline comment — never `#![allow(...)]` at file/crate level. Suppress `clippy::correctness` only for demonstrably false positives (e.g. macro-generated code), with an inline comment.
  - Silent removal or suppression without surfacing the conflict is always wrong.
- **Missing required tests are never out of scope.** When any Claude instance — in any role — encounters a missing test that is required by rule or established convention, it must add the test, regardless of the primary task or role. Piece-by-piece closure is correct — do not batch, defer, or escalate missing tests as a separate task unless the test gap is so large it would dominate the current PR.
- **Separation of concerns over DRY, and ownership boundaries are not negotiable**: Before applying DRY — in implementation or review — establish that both sites serve the same concern; if they serve different concerns, DRY does not apply regardless of structural similarity, and separation of concerns wins. Each component, hook, or module owns its own slice of responsibility, even if that means a parent holds less centralized state — and this is not negotiable under structural pressure: if a constraint seems to justify putting logic where separation-of-concerns says it shouldn't live, find an alternative rather than centralizing. When the user questions why a component owns something it shouldn't, treat that as an instruction to refactor, not an invitation to explain the rationale.
  - ❌ BAD: Centralizing column resize state in `SortableList` and passing it down because it "keeps things in one place"
  - ✅ GOOD: `SortingTableHeader` owns resize state; `SortableListItem` owns its render logic based on layout config — likewise, a shared value that seems to belong in a parent instead comes from `TableConfigProvider` directly
- **DRY (Don't Repeat Yourself)**: Always reuse existing functions instead of duplicating logic — if one already performs the needed operation, call it instead of reimplementing; compose complex operations from existing simple functions.
  - DRY applies per layer independently. Before composing lower-layer primitives at the current layer, inspect the lower layer first — if a composed operation already exists there, delegating to it is the DRY choice (e.g. `imageService.replaceImage` calls `imageDb.replace()` because the DB layer already composes remove + create internally). Compose sibling functions at the current layer only when no equivalent composed operation exists below.
- **Re-derive types after every refactor**: Audit every exported symbol in the changed files — types, factory functions, error constructors, constants — bottom-up from actual usage; never trust existing definitions at face value. A symbol with no call site is dead code regardless of whether it's a type, prop, or exported function.
  1. Trace every field in props types to a value set at a call site. If no caller sets it, remove it.
  2. Trace every field in internal types to a place where it is read. If defined but never accessed, remove it — unless another CLAUDE.md rule mandates its presence regardless of consumption, in which case retain it and make the non-consumption explicit at the call site (underscore-prefixed alias + comment naming the mandating rule).
  3. Trace every exported symbol to at least one import or call site. If nothing imports or calls it, remove it.
- **Grep for duplicate raw literals or expressions before declaring any change set complete.** A raw literal (a regex, a semantic mapping, a magic string/number expressing a domain constraint) or a duplicated expression (a conditional, method chain, or multi-step derivation copied verbatim to compute the same value) appearing independently in two or more files is a missed DRY extraction, regardless of whether the change is a bug fix or new code (e.g. a validation regex re-declared across schema files). Before considering any change set done, grep for every other raw usage of a literal or expression you just introduced, modified, or instructed; two or more independent instances must be extracted to one canonical source with every call site updated, not left as parallel copies.
- **Validate before replicating**: Never assume existing code is compliant with current conventions. Before using any file as a reference implementation — whether discovered by scanning or named by an upstream agent — re-validate it against current CLAUDE.md rules, covering structural patterns (naming, file layout) and behavioral patterns (async handling, error wrapping, query patterns) equally. Convention changes retroactively invalidate previously correct code; a stale reference propagates its violations into every module that copies it. Fix violations found during this check, or surface them, before proceeding.
- **Fix violations in files you touch**: When any write-role Claude instance reads a file to edit it, fix every CLAUDE.md violation found in that file — not just those related to the current task. Applies to all code-touching roles; does not apply to read-only roles. Violations must be fixed in the same edit pass as the file is first touched — not deferred to a later SF, a separate PR, or a follow-up commit. The exception is a violation so large it would dominate and obscure the task commit; fix that in a dedicated preceding `chore(<branch>):` commit before the touching SF begins.
- **Prefer surgical edits over write-from-scratch.** When a task can be accomplished by modifying existing files, evaluate the surgical edit path first. Write from scratch only when the existing content has nothing worth keeping — not because the task is framed as a "rewrite" or because generating fresh content feels faster. Applies to all file types: code, specs, and configuration alike.

### Epistemological Discipline

**Training data confers reasoning capability, never factual authority about external state or this codebase's own scope of impact.** Any claim that will be acted on by the user or a downstream agent — what an external system accepts, exposes, or requires (a library API, a CI action's input schema, a CLI flag, a config format, an endpoint's request body, the set of tools currently available to this instance, or any other specification defined outside this repository), or a claim about this codebase's own scope of impact (e.g. "this option requires no backend changes") — must be verified in the current context window before being stated: read the file, grep the codebase, fetch the documentation, then state the result. If verification is not feasible in the current context window, prefix the claim with "I assume..." — that prefix is the required fallback, not a license to skip feasible verification; a confident, unhedged claim carries an implicit promise that it was verified. Training knowledge tells you where to look and what to ask; it is never sufficient to state that something exists, works a certain way, has a given scope, or does not exist. The corollary: **absence is not provable from training knowledge** — only a lookup that returns no result proves absence. This applies with particular force to `AskUserQuestion` options: each option's description is a factual claim the user relies on to choose, carrying the same verification obligation as any other claim here.

**An unverified hypothesis that shapes an implementation decision must be verified or surfaced — silently acting on it is never valid, even when framed as "accepted risk."** Forming a belief about how an external system or an untested code path behaves and proceeding as if true carries the same verification obligation as stating it aloud — never voicing it does not exempt it. "Accepted risk" is valid only when the user has explicitly accepted the identified risk; labeling an unverified internal hypothesis "accepted risk" without surfacing it is silent risk acceptance and prohibited. When a failure-mode hypothesis forms (e.g. "this callback probably won't re-fire for a known peer"), verify it before building on it; if infeasible, surface it to the user.

**Verified evidence must cover the full scope of the claim it supports — evidence for a narrower fact does not verify a broader claim built on it.** After verifying, check explicitly that what was confirmed matches the breadth of what is being asserted, not merely a related or overlapping fact. A claim of permanent or invariant behavior ("can never," "always," "by default") requires evidence of that same permanence — a one-time seed value or a snapshot of current state verifies only the snapshot, never the invariant. When evidence is narrower than the claim, either narrow the claim to what was verified, or verify the broader claim directly (e.g. confirm no mechanism exists that could change it) before stating it as fact.

**Instruction files exist to instruct agents, not to be read by humans — human readability is never a design goal, not even a secondary one or a tiebreaker; at most it is an unplanned side effect.** Before adding, keeping, or defending any content in a CLAUDE.md, agent, or command file, apply one test: does this content change what an agent does — a decision, a check, a default, a boundary — or is it present for some other reason (orientation, completeness-for-completeness's-sake, human comprehension, narrative flow)? If the latter, it does not belong, regardless of size budget or how established it looks. This also settles how to fix a file that is degrading compliance: a Claude instance loads the entire file into context every invocation and processes every token uniformly, so degraded compliance comes from attention dilution across competing or redundant rules, not from visual density or length as a human reader would experience them — the fix is to merge, relocate, or delete non-instructive content, never to split or shorten for skimmability.

**Verify a mechanism against the live tool registry before asserting how it works — the same discipline applies to this instance's own tooling, not just external systems.** A tool absent from the active list may need loading rather than being gone — check which before falling back to a different approach.

**Citations.** When a verified external-state fact appears in an artifact — a spec, brief, review finding, or architectural decision — mark it inline: `[Role_N: source]`. Role codes: `R` = code-reviewer, `A` = architect, `S` = spec-writer, `I` = implementer, `HI` = head-of-instructions, `HA` = head-of-agents; `N` sequential within that agent's output. Source forms: file read `path:line`; scan `grep <pattern> <path> — found` / `— not found`; web fetch `url`; toolchain execution `ran <command> — observed <result>`. Example: `[S_3: ran npx eslint app/src/scratch-repro.tsx — react-hooks/set-state-in-effect reported on line 12]`. A cited fact is established — downstream agents may use it as a premise without re-verification. An uncited fact — from user input, a reviewer's output, a spec, or another agent's brief — is a claim: verify it before accepting it as a premise, re-stating it as fact, or propagating it into a new artifact; if verification is not possible, flag it as unverified before use. Unverified facts must not appear in artifacts. Every handoff artifact must carry the full citation record from prior work forward — never drop, summarize, or merge citations; a downstream agent without the record must treat all facts as unverified.

**Any artifact for a reader without access to the conversation that produced it — a spec, brief, review verdict, or decision document — must be self-contained.** State reasoning inline in terms the artifact itself establishes; never rely on a fact or rationale existing only in the conversation history. This applies with particular force to mid-session revisions: an update must restate enough context to read standalone, not only as a diff against a conversation the reader wasn't part of.

**When an external system misbehaves, read its documentation before proposing any diagnosis.** This is a pre-proposal gate: the documentation read happens before the first stated cause, not after fix attempts. Assuming the existing configuration is complete and correct — and jumping to environment, credentials, versions, or runtime state — is the failure mode this rule closes.

**Knowledge base.** `.claude/knowledge/` caches verified external-system facts by category file (e.g. `tauri.md`, `lexical.md`). Step 0 of any verification: read the relevant category file — a recorded fact at the current installed version is established, no lookup needed. After any new verification, write the result back. `.claude/knowledge/CLAUDE.md` is authoritative for the entry format, staleness protocol (version mismatch invalidates; append a reverification block, never overwrite), and error correction (fix incorrect entries in the same pass, mirroring "fix violations in files you touch"). Agents without Write permission surface unrecorded facts to the caller for persistence.

### Third-Party Libraries

The general verification obligation above (Epistemological Discipline) applies to all external systems. Concrete lookup procedures for npm packages, ambient/global runtime types, Rust crates, and Tauri configuration values now live in `app/CLAUDE.md` — Third-Party Libraries: this content is app/-specific (`package.json`, `Cargo.toml`, and `tauri.conf.json` all live under `app/`).

### Tool Use Discipline

- **Read discipline: read immediately before editing, only what the current output depends on.** Prior read state is lost after context compaction — re-read before each edit, never after (trust the edit result). Every read must tie to a specific, named file or claim the current output depends on — if you can't name which output line a read resolves, don't make it; don't read to reconstruct historical context, traverse import graphs for ambient understanding, or confirm a just-performed write. Applies only to writing roles — read-only roles have no edits to gate and must not apply it as a defensive habit; role-specific scope ceilings are defined in each agent's file.
- **Verify before naming a path or describing file content in any output — regardless of who supplied it.** Any named path makes a factual claim about the filesystem: "to create" requires verifying absence, "to touch" requires verifying existence, and any content claim (what a file contains, exports, or its length — even hedged) requires having read it in the current context window. Paths supplied by the user or an upstream agent are claims, not facts — the filesystem is the authority. Pattern recognition is not verification: only a Read or Glob result visible in the current response satisfies this rule.
- **All automated checks must pass with zero errors before any commit; baseline failures are triaged by category before implementation begins.** Between sub-features, run `npx tsc --noEmit`, `npx eslint .`, and `prettier --check .` — vitest is deferred (it produces noise from intentionally incomplete intermediate states at sub-feature boundaries). The full suite (tsc + vitest + eslint + prettier) runs twice per session: at the start (baseline) and after the final review cycle, before committing. When `src-tauri/` is touched, the Rust suite (clippy + fmt-check) also runs at both points. Invocations:
  - Type check: `npx tsc --noEmit` (from `app/`)
  - Tests: `npx vitest run` (from `app/`)
  - Lint: `npx eslint .` (from `app/`)
  - Format: `prettier --check .` (from `app/`)
  - Rust lint: `cargo clippy -- -D warnings` (from `app/src-tauri/`, when touched)
  - Rust format: `cargo fmt --check` (from `app/src-tauri/`, when touched)

  Baseline failures: Minor (mechanical, no design judgment) — fix and commit autonomously (`chore(<branch>): fix pre-existing test fixture errors`), no surfacing. Major (a choice between valid alternatives, or an ambiguous cause) — surface to the user with a proposed fix before applying. Never treat any pre-existing error, minor or major, as acceptable baseline noise to filter out or defer.

- **Every code or type reference proposed in any artifact (specs, briefs, review fix proposals, decision documents, inline suggestions) must be verified before inclusion — no exceptions**, per the verification obligation above. Verify first-party symbols by reading the declaring source file; third-party symbols via the library's `index.d.ts` (see Third-Party Libraries). A symbol unconfirmed by a file read must not appear — propose its creation explicitly instead. A barrel export confirms a symbol exists, not its prop API or call signature; read the component or function's own source before writing calls against it.
- **Git command discipline.** Never prefix commands with `cd` — the working directory is already correct in Claude Code's process context, and `cd /path && git ...` breaks `Bash(git *)` permission matching. Never stage by directory path — enumerate every file explicitly (`git add <file1> <file2> ...`, never `git add <directory>/`), since a directory path silently skips sibling files at adjacent levels belonging to the same logical change.
- **Push back when a user instruction is technically impossible.** If an instruction cannot work due to system mechanics (e.g. messaging an agent that has already exited, calling an API that does not exist), do not execute it silently. State what makes it impossible and propose the correct alternative — user instructions are authoritative for intent; correct the mechanism while preserving the intent.
- **After context compaction, the user's live message outranks the session-state summary.** A summary describes what was in progress — it is not an instruction to continue. Read the user's first message in the new window first; when it redirects away from the described pending task, act on the live message and do not resume the pending task.
- **Never edit any CLAUDE.md file directly, and never present a CLAUDE.md edit as an option for the user to choose** — neither writing/editing the file directly, nor offering the change as a selectable `AskUserQuestion` choice, even when the user would accept it. Route every CLAUDE.md instruction gap through `/refine-claude` instead, regardless of role or how minor the change appears — CLAUDE.md changes are head-of-instructions' and head-of-agents' domain exclusively.
- **When a missing permission causes or would cause friction, invoke `update-config` immediately — do not describe the fix and defer.** This applies when the user explicitly requests a permission change, and equally when Claude itself diagnoses that a missing permission is blocking or will block ongoing work — in the latter case invoke the skill proactively; surfacing it as a suggestion and leaving it as "a separate decision" is not acceptable.
