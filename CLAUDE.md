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

- Scope is required and must exactly mirror the branch name — no exceptions. If the branch is `feat/session-screen-rework`, every commit uses `feat(session-screen-rework): <description>` when implementing spec work, or another accurate type with the same scope for commits whose content clearly belongs to a different category (e.g. `docs(session-screen-rework):` for documentation-only changes, `chore(session-screen-rework):` for tooling or pre-existing error fixes).
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`
- Commit type must accurately reflect what the commit does. The branch type is the correct choice for implementation commits. Other standard types are correct when the commit's content unambiguously falls in their category — the reviewer must not flag this as a violation.
- Body is permitted only when it adds information that the subject line cannot convey (e.g. why a non-obvious decision was made)
- Every commit made with Claude assistance must include the co-author trailer as the final line of the commit message body:
  `Co-Authored-By: Claude <noreply@anthropic.com>`
  Do not include the model name — the trailer identifies the author, not the model version.

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
- **Never introduce manual line breaks in prose paragraphs or bullet list items in instruction files** (`.claude/agents/*.md`, `.claude/commands/*.md`, and all CLAUDE.md files). Each paragraph and each bullet item is one continuous line — visual wrapping is the IDE/renderer's responsibility. This does not apply to code blocks, tables, or fenced examples.
- **Pass props directly when no transformation, guard, renaming, or toolchain enforcement is needed — never wrap them in a named function.** A wrapper function that only forwards its argument unchanged to another function adds no logic and must not exist. Inline the prop reference directly. This rule applies to JSX prop wiring — it does not govern hook return types or public API boundaries where a wrapper hides implementation details and presents a domain-typed interface.
  - ❌ BAD: `const handleMouseEnter = () => onMouseEnterBridge(); <Foo onMouseEnter={handleMouseEnter} />`
  - ✅ GOOD: `<Foo onMouseEnter={onMouseEnterBridge} />`
  - A wrapper is permitted only when it adds a transformation (`() => onClose(id)`), a guard (`() => { if (enabled) onSubmit() }`), adapts a signature mismatch (`(e: MouseEvent) => onSelect(e.currentTarget.dataset.id)`), or is required by an active ESLint rule (`() => { void handleAsync(); }` — required by `@typescript-eslint/no-misused-promises` to explicitly discard a Promise return where a synchronous callback is expected).
- **When a file is moved or promoted to a new location, update all consumers to import from the new location — never introduce a re-export in the old barrel solely to preserve existing import paths.** A backward-compat re-export hides the migration, leaves consumers pointing at a stale path through an indirection layer, and violates the principle that imports should reflect where symbols actually live.
  - ❌ BAD: Adding `export { getDateTimeString } from '@util/getDateTimeString'` to `src/util/index.ts` so existing callers do not need updating
  - ✅ GOOD: Remove the barrel re-export; update every consumer to `import { getDateTimeString } from '@util/getDateTimeString'` directly

### Accountability on Missed Requirements

When caught having missed a rule, a test, a cleanup item, or anything that CLAUDE.md or project conventions required, do not stop at acknowledging the miss. On the first pushback — before being asked again — immediately provide all four of the following:

1. **Which rule applies** — cite it exactly, state why it is not scoped to a subset of cases (i.e., why it applied here), and identify its source: explicit instruction in CLAUDE.md, inferred from project conventions, inferred from examples, or derived from general principles.
2. **Why it was missed** — not what was wrong in the output, but what went wrong in the reasoning process that produced the miss.
3. **The wrong mental model** — the assumption or shortcut that caused the reasoning to fail.
4. **The correct mental model** — the replacement belief or check that would have caught it.

The first pushback is the prompt. Do not wait for a second or third before providing this analysis.

If the source in point 1 is anything other than explicit instruction in CLAUDE.md, flag it: "This rule is not yet written down explicitly — consider adding it to CLAUDE.md."

### Communication Style

Never open a response with a positive affirmation directed at the user or a teammate's output. Phrases like "Good catch.", "Clean analysis.", "You're right.", "Good question." add no information and must be omitted. Start with the substance of the response.

**Always state your actual reasoning — never the reasoning you expect the user to want to hear.** When challenged on a decision, an analysis, or a stated fact, the answer must reflect what the internal analysis actually concludes, even when that conclusion contradicts a prior statement or contradicts the user's apparent expectation. If a prior statement was wrong, say so directly and state what was wrong about it. If the prior statement was correct and the challenge does not change the analysis, say so directly. A response that tells the user what they want to hear while the internal analysis reaches a different conclusion is a violation of this rule regardless of whether the sycophantic answer is technically defensible.

### Best Practices & Code Quality

- **When the user opts for an approach that conflicts with documented best practices or is flagged as inadvisable by the relevant framework or library authors, push back explicitly before implementing.** Do not assume the user's choice is informed — surface the concern and confirm it is intentional. If the user confirms, implement as asked. This is not a license to withhold implementation indefinitely; one explicit pushback is required, then proceed on confirmation.
- **When a linter or compiler finding conflicts with an intentional design goal, surface the conflict — never comply silently.** Automated checks are heuristics, not commands. When a rule fires against code that was written to achieve a documented design goal (e.g., `no-unnecessary-type-parameters` fires on a generic kept to enforce excess property checking at call sites), state the conflict explicitly: what the rule flags, what design goal the code serves, and what the options are. Let the user decide. If the decision is to suppress the rule, apply the narrowest suppression with an inline explanation of why:
  - **ESLint (TypeScript/JS):** Prefer `eslint-disable-next-line <rule>` for a single occurrence. When the formatter (e.g. Prettier) splits the flagged construct across multiple lines and `eslint-disable-next-line` would land on the wrong line, file-scoped suppression (`/* eslint-disable <rule> */` at the top of the file) is the narrowest valid alternative — but only when the suppression is scoped to a single-concern file where the design goal applies to the whole file.
  - **Clippy (Rust):** Prefer `#[allow(clippy::lint_name)]` on the smallest enclosing item (function or block) for a single occurrence, with an inline comment explaining why. Never use `#![allow(...)]` at the file or crate level — that suppresses the lint everywhere in the file, which is never the narrowest scope. Only suppress `clippy::correctness` lints when the lint is a demonstrably false positive (e.g., in macro-generated code), with an inline comment explaining why it is a false positive.
  - Silent removal or silent suppression without surfacing the conflict is always wrong.
- **Missing required tests are never out of scope.** When any Claude instance — in any role — encounters a missing test that is required by rule or by established convention, it must add the test. This applies regardless of the primary task, the role (architect, reviewer, implementer, spec-writer), or the scope of the current feature. "Out of scope" is not a valid classification for a test that is required by rule. Piece-by-piece closure is correct — do not batch, defer, or escalate missing tests as a separate task unless the test gap is so large it would dominate the current PR.
- **Separation of concerns over DRY**: Before applying DRY — whether in implementation or in review — establish that both sites serve the same concern. If they serve different concerns, DRY does not apply regardless of structural similarity. When DRY and separation of concerns conflict, always prefer separation of concerns. Each component, hook, or module owns its own slice of responsibility — even if that means a parent holds less centralized state.
  - ❌ BAD: Centralizing column resize state in `SortableList` and passing it down because it "keeps things in one place"
  - ✅ GOOD: `SortingTableHeader` owns resize state; `SortableListItem` owns its render logic based on layout config
- **Ownership boundaries are not negotiable**: If a structural constraint seems to justify putting logic in a component that the separation-of-concerns rules say should not own it, find an alternative — do not centralise and do not defend the decision if challenged. When the user questions why a component owns something it shouldn't, treat that as an instruction to refactor, not an invitation to explain the rationale.
  - ❌ BAD: "I put grid layout in `SortableList` because header and items are siblings and need a shared value"
  - ✅ GOOD: Find a way for each component to derive what it needs independently (e.g. both read from `TableConfigProvider` directly)
- **Context value types must contain only what external consumers call through the hook.** A function called exclusively inside the provider's own module is not part of the public API — it belongs in local scope, not on the `ContextValue` type. Placing provider-internal functions on the context type widens the public interface beyond what consumers need and obscures which operations are genuinely external.
  - ❌ BAD: `updatePopupZIndex` and `updatePopupPosition` on `PinnedPopupsContextValue` when only the provider's render loop calls them
  - ✅ GOOD: `updatePopupZIndex` and `updatePopupPosition` defined as local functions inside the provider; `PinnedPopupsContextValue` exposes only what `usePinnedPopups()` callers actually invoke
- **DRY (Don't Repeat Yourself)**: Always reuse existing functions instead of duplicating logic
  - If a function already exists that performs the needed operation, call it instead of reimplementing
  - Compose complex operations from existing simple functions
  - DRY applies per layer independently. Before composing lower-layer primitives at the current layer, inspect the lower layer first. If a composed operation already exists there, delegating to it is the DRY choice — never re-compose what a lower layer already encapsulates.
  - ❌ BAD: Duplicating database calls and state updates in multiple functions
  - ✅ GOOD: `imageService.replaceImage` calls `imageDb.replace()` because the DB layer already composes remove + create internally — re-implementing that composition at the service level would duplicate it
  - ✅ GOOD: Composing sibling service functions (e.g. `deleteImage()` + `createImage()`) inside a service-level operation only when no equivalent composed operation exists in the layer below
- **Re-derive types after every refactor**: After any refactor, audit every exported symbol in the changed files — types, factory functions, error constructors, constants — bottom-up from actual usage. Never trust existing definitions at face value. A symbol with no call site is dead code regardless of whether it is a type, a prop, or an exported function.
  1. Trace every field in props types to a value being set at the call site. If no caller sets it, remove it.
  2. Trace every field in internal types to a place where it is read and used. If a field is only defined but never accessed, remove it.
  3. Trace every exported symbol (error type, factory function, constant, utility) to at least one import or call site in the codebase. If nothing imports or calls it, remove it.
  - ❌ BAD: Keeping `render` on `ListColumn<T>` after a refactor because it was there before, without checking if any caller sets it or any reader accesses it
  - ✅ GOOD: After refactor, scanning every field of `ListColumn<T>` and finding `render` is never called → remove the field and the dead branch
- **Validate before replicating**: Never assume existing code is compliant with current conventions. Before using any file as a reference implementation or pattern to follow, re-validate it against current CLAUDE.md rules — regardless of source: whether the reference was discovered during codebase scanning or named in the input by an upstream agent, the same validation pass applies. This applies to structural patterns (naming, file layout) and behavioral patterns (async handling, error wrapping, query patterns) equally. Convention changes retroactively invalidate previously correct code — if the reference is stale, the violation propagates to every new module that copies it. Fix violations found during this check, or surface them to the user, before proceeding.
  - ❌ BAD: "Follow the NPC pattern" → copy the barrel file shape without checking it against the barrel convention
  - ✅ GOOD: "Follow the NPC pattern" → read `npcs/index.ts`, verify it matches current barrel file rules (structural conventions) and current behavioral patterns (async handling, error wrapping), fix or flag any violations, then use it as a template
- **Fix violations in files you touch**: When any write-role Claude instance reads a file to edit it, fix every CLAUDE.md violation found in that file — not just those related to the current task. Applies to all code-touching roles (implementer, any agent that writes or edits files). Does not apply to read-only roles (code-reviewer, architect, spec-writer in read pass). Violations found must be fixed in the same edit pass as the file is first touched — not deferred to a later SF, a separate PR, or a follow-up commit. Fix them before moving to the next file in the SF. The exception is a violation so large it would dominate and obscure the task commit; in that case, fix it in a dedicated preceding commit with a `chore(<branch>):` message before the touching SF begins.
  - ❌ BAD: Noticing a missing try/catch in a service file being edited for a new function, and leaving it unfixed
  - ✅ GOOD: Fixing the missing try/catch in the same edit pass before committing the new function
- **Prefer surgical edits over write-from-scratch.** When a task can be accomplished by modifying existing files, evaluate the surgical edit path first. Read the existing files, identify what must change, and apply targeted edits. Write from scratch only when the existing content has nothing worth keeping — not because the task is framed as a "rewrite" or because generating fresh content feels faster. This applies to all file types: code, specs, and configuration alike.
- **Specs must be internally self-consistent before emission.** Before finalising any test specification, verify two things against the spec document itself — no external lookup needed:
  1. **Assertion arity**: for every `toHaveBeenCalledWith(...)` assertion, count the matchers. Count the arguments in the corresponding call site in the same spec. They must match exactly.
  2. **Isolation adequacy**: if the spec adds a second or third test to a file that calls a function owning module-level singleton state, the existing isolation scaffolding is not "unchanged" — it is a decision point. Verify that the specified scaffolding resets that state before each test, not just after the last one.

### Epistemological Discipline

**Training data confers reasoning capability, never factual authority about external state.** Any claim about what an external system accepts, exposes, or requires — regardless of surface: a library's API, a CI action's input schema, a CLI flag, a config file format, a REST endpoint's request body, or any other specification defined outside this repository — must be verified in the current context window before being stated. The surface type is irrelevant; the obligation is the same. Do not state the fact and verify later. Training knowledge is a starting point for knowing *where* to look and *what questions to ask*; it is never sufficient to state that something exists, works a certain way, or does not exist.

The corollary: **absence is not provable from training knowledge.** Claiming that a rule, symbol, or feature does not exist based on not recognizing it from training is always wrong — only a lookup that returns no result proves absence.

**In conversational output, verify before stating — and hedge when you cannot.** When answering a question or making a claim about external state (a library's API, a file's contents, a CLI flag, a config schema, or any tooling behavior) in a conversational response, perform the verification first — read the file, grep the codebase, or fetch the documentation — then state the result. If verification was not performed or is not possible in the current context window, prefix the claim with "I assume..." to make the epistemic status explicit. "I assume..." is not a license to skip verification when verification is feasible — it is the required fallback when it is not. A confident, unhedged claim in conversational output carries an implicit promise that it was verified.

When a verified fact about external state appears in an artifact — a spec, brief, review finding, or architectural decision — mark it with an inline citation immediately after the claim: `[Role_N: source]`. Role codes: `R` = code-reviewer, `A` = architect, `S` = spec-writer, `I` = implementer; `N` is sequential within that agent's output. Source forms:

- File read: `path:line`
- Scan confirmed present: `grep <pattern> <path> — found`
- Confirmed absence: `grep <pattern> <path> — not found`
- Web fetch: `url`

Examples: `[R_1: app/eslint.config.js:12]`, `[A_2: grep "set-state-in-effect" node_modules/eslint-plugin-react-hooks — found]`

This allows downstream agents and future cycles to treat verified facts as established without re-verifying them. Unverified facts must not appear in artifacts — verify first, then cite, or do not state the fact.

**Stated facts arriving from any source are subject to the same discipline.** When a fact enters the current context — from user input, a reviewer's output, a spec, or another agent's brief — its epistemic status is determined by whether it carries a citation. A fact with a `[Role_N: source]` citation is established and may be used as a premise without re-verification. A fact without a citation is a claim — it must be verified before being accepted as a premise, re-stated as fact, or propagated into a new artifact. If verification is not possible in the current context, the fact must be flagged as unverified before use.

**Every handoff artifact must carry the full citation record.** When producing a brief, review output, or any artifact passed to another agent or cycle, include all `[Role_N: source]` citations from prior work — not only the citations introduced in the current output. Citations must not be dropped, summarized, or merged when forwarding. A downstream agent receiving an artifact without its full citation record cannot distinguish established facts from unverified claims and must treat all facts as unverified.

### Third-Party Libraries

The general verification obligation above applies to all external systems. For **npm packages specifically**, the lookup procedure is:

1. Check the installed version in `package.json`
2. Fetch the official documentation for that exact version from the internet
3. If documentation is ambiguous or unavailable, ask before proceeding

This applies especially to: TanStack Query, TanStack Router, Lexical, Tauri, and Drizzle.

To inspect what a library actually exports, use Read or Glob on its `index.d.ts` (e.g. `node_modules/<package>/dist/index.d.ts`). Never use `node -e` or any runtime introspection — type declarations are the authoritative source and require no execution.

### Tool Use Discipline

- **Always Read a file immediately before editing it — this rule is a pre-edit gate, not a general reading habit.** Treat any prior read state as lost after context compaction — do not assume a file read earlier in the session is still accurate. Re-read before each edit. Do not re-read a file after editing it to verify the write — trust the edit result. This rule applies only to writing roles; read-only roles (reviewer, architect, spec-writer in read-pass) have no edits to gate and must not apply it as a defensive habit.
- **Read scope is minimum viable.** Every read must be tied to a specific, named file or claim that the current output depends on. If you cannot state which output line the read is resolving before making it, do not make it. Do not read files to reconstruct historical context, to traverse import graphs for ambient understanding, or to confirm a write you just performed. Role-specific scope ceilings are defined in each agent's file.
- **Verify before naming a path or describing a file's content in any output.** Any file path named in output — briefs, specs, task lists, plans — makes a factual claim about the filesystem. Before listing a path as "to create", verify it does not already exist. Before listing a path as "to touch", verify it does exist. Absence of prior mention in the conversation is not evidence of absence in the codebase. The same principle extends to content: never state or imply facts about what a file contains, how long it is, what it exports, or what structure it has — even hedged ("almost certainly", "probably") — without having read it first in the current context window. **Pattern recognition is not verification.** Recognizing a familiar convention (e.g., "this problem will be solved with using `.prettierrc`") does not satisfy this rule — only a Read or Glob tool call result visible in the current response does. If no tool call was made, the path or content claim must not appear in the output.
- **Verify import paths resolve from the importer's location and use the correct import form.** When an artifact (spec, brief, review finding, architectural decision) names an import path — e.g., `import Foo from './components'` — verify that the path resolves correctly relative to the file that will contain the import statement, not just that the target directory or file exists. A target that exists at `session/components/` does not make `'./components'` valid from `session/components/PrepView.tsx` — that resolves to `session/components/components/`. Confirm the importer's location, resolve the path from it, and verify the result resolves to a specific file — not a directory — before including the import in any artifact. Additionally verify import form: a path whose last two segments repeat the same name (`ComponentName/ComponentName`) is the double-name anti-pattern. When a barrel (`index.ts`) exists for the target directory, always use the barrel or directory path instead — the double-name form is wrong. When no barrel exists and the grouping barrel cannot be used (e.g., circular dependency), the explicit file path is the only valid form and is correct.
- **Verify user-provided paths before treating them as facts.** When a user names a file or directory path during instruction refinement, auditing, or any artifact review, verify it exists (or does not exist) by reading the filesystem before accepting it as ground truth. User-provided paths are claims, not facts — the filesystem is the authority. This applies even when the path sounds plausible or matches a pattern used elsewhere in the repo.
- **All automated checks must pass with zero errors or failures before any commit.** "After all files for a sub-feature" means: when the full sub-feature is code-complete, not after every individual file edit. Between sub-features during implementation, run `npx tsc --noEmit`, `npx eslint .`, and `prettier --check .` — vitest produces noise from intentionally incomplete intermediate states at sub-feature boundaries and is the only check deferred. The full TypeScript suite (tsc + vitest + eslint + prettier) runs twice per session: once at the start (baseline) and once after the final review cycle concludes (before committing). When any `src-tauri/` file is touched, the Rust suite (clippy + fmt-check) also runs twice — at session baseline and before committing. Pre-existing failures must be resolved before implementation begins — they are never filtered out, deferred, or treated as acceptable baseline noise. A commit that precedes passing checks is a commit on broken code. Checks and their invocations:
  - Type check: `npx tsc --noEmit` (from `app/`)
  - Tests: `npx vitest run` (from `app/`)
  - Lint: `npx eslint .` (from `app/`)
  - Format: `prettier --check .` (from `app/`)
  - Rust lint (when `src-tauri/` files are touched): `cargo clippy -- -D warnings` (from `app/src-tauri/`)
  - Rust format check (when `src-tauri/` files are touched): `cargo fmt --check` (from `app/src-tauri/`)
- **Pre-existing errors discovered during the baseline check fall into two categories.** Minor errors — mechanical to fix (adding or removing a field to match a changed type), and requiring no design judgment — must be fixed and committed autonomously without surfacing to the user (`chore(<branch>): fix pre-existing test fixture errors`). Major errors — requiring a choice between valid alternatives, or whose cause is ambiguous from the error output alone — must be surfaced to the user with a proposed fix before applying. Never defer, filter, or treat any pre-existing error as acceptable baseline noise.
- **Every code or type reference proposed in any artifact must be verified before inclusion — no exceptions.** Artifacts include specs, briefs, review fix proposals, architectural decision documents, and inline suggestions. Before including a symbol, import path, function signature, or type name: verify it is real by reading the file at the declared path and confirming the symbol is exported there. For third-party symbols, inspect the library's `index.d.ts` (see Third-Party Libraries). For first-party symbols, read the source file. A symbol that cannot be confirmed by a file read must not appear in the artifact — propose its creation explicitly instead. Training knowledge of what a file exports is never sufficient. **A barrel file confirms that a symbol is exported — it does not confirm the symbol's prop API or call signature.** When artifact code calls a first-party component or function with specific props or arguments, read the component or function's own source file to verify the prop names and types — never rely on a barrel export as proof of API shape.
- **Before placing a hook call in any component — in artifact code or in implementation — verify the component renders below every provider the hook depends on.** Reading the component file is not sufficient; the component's position in the provider tree must be traced. A hook that depends on a context provider (e.g., `useQuery` depending on `QueryClientProvider`) cannot be called in a component that renders above that provider. When a component is extracted or moved, re-trace its tree position before adding or retaining any hook calls.
- **Code in any artifact must be valid under the project's full toolchain configuration, not just type-declaration correct.** Before including a code example in a spec, brief, review finding, or architectural decision, verify it is compatible with the active `tsconfig.json` compiler flags and ESLint plugin rules — not merely that the symbols exist. Two classes of error pass symbol verification but fail at toolchain application time: (1) compiler flag strictness — e.g., with `exactOptionalPropertyTypes: true`, assigning `T | undefined` to an optional property typed `T` is a type error even though both types are valid in isolation; (2) ESLint plugin rules — e.g., `react-hooks/refs` bans reading `ref.current` inside a render callback even when the ref is correctly typed. Verify against `app/tsconfig.json` and `app/eslint.config.js` before writing code that depends on their settings. Training knowledge of what TypeScript or ESLint permits in the abstract is never sufficient.
- **Never prefix git commands with `cd`.** The working directory is set correctly by Claude Code's process context. `cd /path && git ...` does not match `Bash(git *)` permissions and causes unnecessary prompts — always issue git commands directly: `git log --oneline -5`, not `cd /Users/simonschoetz/dev/gm-tool && git log --oneline -5`.
- **Never stage by directory path — always enumerate files explicitly.** When committing, name every file individually: `git add <file1> <file2> ...` — never `git add <directory>/`. A directory path stages everything inside that directory but silently skips any sibling files at adjacent levels that belong to the same logical change. When a commit spans files across more than one directory level, build the file list explicitly before running `git add`.
- **Distinguish one-shot workers from long-running teammates.** Agents spawned via the Agent tool are one-shot workers — they execute, return a result, and exit. They cannot receive SendMessage and must not be "resumed." Teammates spawned via TeamCreate are long-running — they persist in the session and can receive SendMessage. Before spawning a new teammate for the same role, attempt to resume the existing one via SendMessage. If SendMessage fails after one retry, surface the failure explicitly — never silently substitute a new instance. Silent substitution hides continuity loss from the user and invalidates any prior context the teammate held.
- **Push back when a user instruction is technically impossible.** If a user asks Claude to perform an action that cannot work due to system mechanics (e.g., sending a message to an agent that has already exited, calling an API that does not exist), do not execute it silently. State what makes the instruction impossible, explain the knowledge gap briefly, and propose the correct alternative. User instructions are authoritative for intent — but when the requested mechanism is wrong, Claude must correct the mechanism while preserving the intent.
- **When a missing permission causes or would cause friction, invoke `update-config` immediately — do not describe the fix and defer.** The `update-config` skill applies in two cases: (1) the user explicitly requests a permission change ("allow X", "add permission for Y"), and (2) Claude itself diagnoses that a missing `Edit`, `Write`, `Bash`, or other permission is blocking or will block ongoing work. In case 2, Claude must invoke the skill proactively — surfacing it as a suggestion and leaving it as "a separate decision" is not acceptable. The permission gap is diagnosed; the fix is known; invoking the skill is the correct next action.

#### File Organization

- **1 concern → 1 file**: A concern is defined by domain ownership, not operation type or access shape. Everything that belongs to the same domain entity belongs in the same file or module — splitting by singular/plural query, or by read/write, fragments cohesion without benefit.
  - ✅ GOOD: `create.ts`, `get.ts`, `remove.ts` at the DB layer — each is an independent public operation on a different concern (creation vs. retrieval vs. deletion)
  - ✅ GOOD: `allTermsMatchItem.ts` containing private `getSearchableText` and `termMatchesItem` — they exist only to support `allTermsMatchItem`
  - ❌ BAD: `utils.ts` with unrelated helpers dumped together
- **Tests mirror file structure**: Test files live in a `__tests__/` subdirectory next to the code they test
  - Source: `helper/parseSearchTerms.ts` → Test: `helper/__tests__/parseSearchTerms.test.ts`
- Error handling: see `app/src/CLAUDE.md` — State Management & Error Handling

## Product

### Vision

Convinced of the transformative power and positive impact of table top role playing games (TTRPGs), the GM Tool makes crunchier systems like Dungeons and Dragons (D&D) more accessible for new audiences.

### Mission

Lowering the entry barrier for new Game Masters (GMs) and help experienced ones to avoid "GM fatigue"/burnout by guiding through the process of session preparation inspired by Michael Shea's "Return of the Lazy Dungeon Master". With an opinionated database structure, the GM Tool helps building an organic collection of non-player characters (NPCs), places, items, etc. and helps to track their influence on the story created with the players during game play.
