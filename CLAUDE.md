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
├── db/ # SQLite database
│ └── CLAUDE.md
├── docs/ # planning docs — see app/docs/CLAUDE.md
├── public/ # Static assets
├── src/ # React frontend source
│ └── CLAUDE.md
├── src-tauri/ # Rust backend (Tauri)
│ └── CLAUDE.md
└── util/

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

- Scope is required and must exactly mirror the branch name — if the branch is `feat/session-screen-rework`, every commit on that branch uses `feat(session-screen-rework): <description>`
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`
- Branch types and commit types share the same vocabulary — use the same word in both
- Body is permitted only when it adds information that the subject line cannot convey (e.g. why a non-obvious decision was made)
- Every commit made with Claude assistance must include the co-author trailer as the final line of the commit message body:
  `Co-Authored-By: Claude <noreply@anthropic.com>`
  Do not include the model name — the trailer identifies the author, not the model version.

### Code styles and convention

#### Coding style

- typescript first
- types over interfaces
- Use modern arrow function syntax. Classes are permitted only where a third-party framework API requires inheritance — e.g., Lexical node types (extending `DecoratorNode`, `TextNode`, etc.) and `MenuOption` subclasses. Do not introduce classes for any other reason.
- **Error types use factory functions, not classes.** Create typed errors with a factory function and type narrowing — never `class XxxError extends Error`. This aligns with "types over interfaces" and "arrow functions only." `instanceof` is not used in this codebase — all errors route to the Error Boundary via `throwOnError: true`.

```ts
// ✅ GOOD
export type SessionLoadError = Error & { name: 'SessionLoadError' };
export const sessionLoadError = (cause?: unknown): SessionLoadError => {
  const error = new Error(`Failed to load sessions: ${cause}`) as SessionLoadError;
  error.name = 'SessionLoadError';
  return error;
};

// ❌ BAD
export class SessionLoadError extends Error { ... }
```

- **`as const` over `enum`**: Use `as const` objects with derived union types instead of TypeScript enums. Enums are runtime IIFE constructs that conflict with the "types over interfaces" posture. An `as const` object gives identical DX — dot-access, autocomplete, type narrowing, exhaustive checks — without a runtime construct.
  ```ts
  // ✅ GOOD
  export const Routes = {
    ADVENTURES: 'adventures',
    SESSION: 'session',
  } as const;
  export type AppRoute = (typeof Routes)[keyof typeof Routes];

  // ❌ BAD
  export enum Routes {
    ADVENTURES = 'adventures',
    SESSION = 'session',
  }
  ```

- Never use `undefined` as a value in business logic — not as a return type, not as a local variable initializer, and not in a union type for a local variable that represents domain state. Use `null` for "no value yet" and explicit error types for error states. `undefined` is a language default — its presence in domain code signals a missing initialization decision.
  - ❌ BAD: `let session: Session | undefined;`
  - ✅ GOOD: `let session: Session | null = null;`
- avoid using `any` as type
- Use descriptive names instead of comments
  ❌ BAD: `const data = await fetch(); // Get user data`
  ✅ GOOD: `const userData = await fetchUserData();`
- **Route explanatory knowledge to its narrowest correct scope.** When a name alone is insufficient, stop at the first level that fits:
  1. **Inline comment** — specific to a single line, no meaning outside it
  2. **Top-of-file comment** — applies to multiple constructs within one file
  3. **Parent component comment** — scoped to a component subtree
  4. **CLAUDE.md** — a codebase-wide convention any Claude instance must know

  A comment that would need to be duplicated in more than one file is not a comment — it is a missing CLAUDE.md rule.
- Use modern JavaScript operators for cleaner code:
  ❌ BAD: `const x = value !== undefined ? value : defaultValue`
  ✅ GOOD: `const x = value ?? defaultValue`
  ❌ BAD: `if (obj && obj.prop && obj.prop.nested) { ... }`
  ✅ GOOD: `if (obj?.prop?.nested) { ... }`
- use single quotes
- multiple array/object items in new lines
- **Markdown files must comply with markdownlint default rules.** No markdownlint config file exists in this repo — the defaults are the standard. This applies to all `.md` files in the repo.

### Accountability on Missed Requirements

When caught having missed a rule, a test, a cleanup item, or anything that CLAUDE.md or project conventions required, do not stop at acknowledging the miss. On the first pushback — before being asked again — immediately provide all four of the following:

1. **Which rule applies** — cite it exactly and state why it is not scoped to a subset of cases (i.e., why it applied here).
2. **Why it was missed** — not what was wrong in the output, but what went wrong in the reasoning process that produced the miss.
3. **The wrong mental model** — the assumption or shortcut that caused the reasoning to fail.
4. **The correct mental model** — the replacement belief or check that would have caught it.

The first pushback is the prompt. Do not wait for a second or third before providing this analysis.

### Communication Style

Never open a response with a positive affirmation directed at the user or a teammate's output. Phrases like "Good catch.", "Clean analysis.", "You're right.", "Good question." add no information and must be omitted. Start with the substance of the response.

### Best Practices & Code Quality

- **Always suggest and implement best practices first**
- When multiple valid approaches exist, explain the tradeoffs and recommend the best option
- Proactively warn against anti-patterns, deprecated features, or "escape hatches" (like useImperativeHandle, useLayoutEffect, etc.)
- If a user requests an approach that goes against best practices, explain why it's not recommended and suggest the better alternative
- Don't just implement what's asked - guide toward the right solution
- Use SOLID principles where applicable
- **Separation of concerns over DRY**: When these two principles conflict, always prefer separation of concerns. Each component, hook, or module owns its own slice of responsibility — even if that means a parent holds less centralised state.
  - ❌ BAD: Centralising column resize state in `SortableList` and passing it down because it "keeps things in one place"
  - ✅ GOOD: `SortingTableHeader` owns resize state; `SortableListItem` owns its render logic based on layout config
- **Ownership boundaries are not negotiable**: If a structural constraint seems to justify putting logic in a component that the separation-of-concerns rules say should not own it, find an alternative — do not centralise and do not defend the decision if challenged. When the user questions why a component owns something it shouldn't, treat that as an instruction to refactor, not an invitation to explain the rationale.
  - ❌ BAD: "I put grid layout in `SortableList` because header and items are siblings and need a shared value"
  - ✅ GOOD: Find a way for each component to derive what it needs independently (e.g. both read from `TableConfigProvider` directly)
  - **Data fetching is not an exception**: "The parent fetches once and passes down" is not a valid justification for prop drilling. Each component that needs data calls the hook itself. TanStack Query's shared cache deduplicates fetches — there is no performance penalty. Props are for state that genuinely belongs to a parent (cross-component coordination, e.g. tooltip visibility). If a component has a button, that component owns the button's action — it does not receive a callback from two levels up.
    - ❌ BAD: `SessionScreen` fetches session data, passes it to `PrepView`, which passes it to `StepSection`, which passes it to `StepSectionHeader`
    - ✅ GOOD: `StepSectionHeader` calls `useSession(sessionId)` directly; TanStack Query serves the cached value
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
- **Validate before replicating**: Never assume existing code is compliant with current conventions. Before using any file as a reference implementation or pattern to follow, re-validate it against current CLAUDE.md rules. Convention changes retroactively invalidate previously correct code — if the reference is stale, the violation propagates to every new module that copies it. Fix violations found during this check, or surface them to the user, before proceeding.
  - ❌ BAD: "Follow the NPC pattern" → copy the barrel file shape without checking it against the barrel convention
  - ✅ GOOD: "Follow the NPC pattern" → read `npcs/index.ts`, verify it matches current barrel file rules, fix or flag any violations, then use it as a template

### Third-Party Libraries

Never assume training knowledge is current for third-party libraries. Before suggesting or implementing anything that depends on a specific library API, version, or feature:

1. Check the installed version in `package.json`
2. Fetch the official documentation for that exact version from the internet
3. If documentation is ambiguous or unavailable, ask before proceeding

This applies especially to: TanStack Query, TanStack Router, Lexical, Tauri, and Drizzle.

To inspect what a library actually exports, use Read or Glob on its `index.d.ts` (e.g. `node_modules/<package>/dist/index.d.ts`). Never use `node -e` or any runtime introspection — type declarations are the authoritative source and require no execution.

### Tool Use Discipline

- **Always Read a file before editing it in the current context window.** Treat any prior read state as lost after context compaction — do not assume a file read earlier in the session is still accurate. Re-read before editing.
- **Verify before naming a path in any output.** Any file path named in output — briefs, specs, task lists, plans — makes a factual claim about the filesystem. Before listing a path as "to create", verify it does not already exist. Before listing a path as "to touch", verify it does exist. Absence of prior mention in the conversation is not evidence of absence in the codebase.
- **`npx tsc --noEmit` must pass with zero errors before any commit.** Run it once after all files for a sub-feature are written — not after every individual file edit, which produces noise from intentionally incomplete intermediate states. Pre-existing errors must be resolved before implementation begins — they are never filtered out, deferred, or treated as acceptable baseline noise. A commit that precedes a passing type-check is a commit on broken code.
- **`npx vitest run` must pass with zero failures before any commit.** Run it once after all files for a sub-feature are written — same timing as tsc, not after every individual file edit. Pre-existing failures must be resolved before implementation begins — they are never filtered out or deferred. A commit that precedes a passing test run is a commit on broken code.
- **Re-validate spec instructions that touch file organization before executing them.** A spec is written by a prior instance that may have mis-applied current conventions. Before executing any spec instruction that specifies barrel shape, export style, or directory structure — including "no change needed" — re-read the relevant CLAUDE.md barrel rules and verify the instruction is consistent. If it is not, apply the correct convention and note the deviation. The spec is a starting point, not a source of truth for convention questions.
- **Every code or type reference proposed in any artifact must be verified before inclusion — no exceptions.** Artifacts include specs, briefs, review fix proposals, architectural decision documents, and inline suggestions. Before including a symbol, import path, function signature, or type name: verify it is real by reading the file at the declared path and confirming the symbol is exported there. For third-party symbols, inspect the library's `index.d.ts` (see Third-Party Libraries). For first-party symbols, read the source file. A symbol that cannot be confirmed by a file read must not appear in the artifact — propose its creation explicitly instead. Training knowledge of what a file exports is never sufficient.
- **Never prefix git commands with `cd`.** The working directory is set correctly by Claude Code's process context. `cd /path && git ...` does not match `Bash(git *)` permissions and causes unnecessary prompts — always issue git commands directly: `git log --oneline -5`, not `cd /Users/simonschoetz/dev/gm-tool && git log --oneline -5`.

#### File Organization

- **1 concern → 1 file**: A concern is defined by domain ownership, not operation type or access shape. Everything that belongs to the same domain entity belongs in the same file or module — splitting by singular/plural query, or by read/write, fragments cohesion without benefit.
  - ✅ GOOD: `sessionKeys.ts` owns all query key factories for sessions; `useSession.ts` owns the single-entity query + mutations; `useSessions.ts` owns the collection query + mutations — no provider, TanStack Query's shared cache deduplicates across hooks
  - ✅ GOOD: `create.ts`, `get.ts`, `remove.ts` at the DB layer — each is an independent public operation on a different concern (creation vs. retrieval vs. deletion)
  - ✅ GOOD: `allTermsMatchItem.ts` containing private `getSearchableText` and `termMatchesItem` — they exist only to support `allTermsMatchItem`
  - ❌ BAD: `utils.ts` with unrelated helpers dumped together
  - ❌ BAD: A `DomainProvider` that owns mutations and passes them as props — TanStack Query replaces manual providers; the hooks ARE the data access layer
- **Export via barrel file**: Two directory types exist — distinguish them before adding or deleting a barrel:
  - **Module directory**: owns a single domain entity (`npcs/`, `adventures/`, `table-config/`). Always exposes its public API through an `index.ts`. This barrel is required.
  - **Grouping folder**: organizes module directories but owns no domain itself (`data-access-layer/`, `components/`, `util/`, `hooks/`, `services/`). Every grouping folder under `src/` **requires** a barrel (`index.ts`) with explicit named exports — `export *` is banned in grouping barrels. External consumers always import from exactly one level: `@/components`, `@/data-access-layer`, `@/util`, etc. — never deeper. Within-module imports use the module directory barrel via relative path (`./SortableListItem`, not `@/components/SortableList/SortableListItem`). Exceptions with no barrel: `routes/` (managed by TanStack Router file conventions), `styles/` (CSS only), `assets/`.
  - `@db` is an explicit exception: no grouping barrel exists at the db root due to operation name collisions across domains (`create`, `get`, `remove`, etc. exist in every domain module). `@db/domainName` is the expected import depth for all consumers — including type imports from the frontend. Never import from `@db/domainName/types` or deeper.
  - In **module directory barrels**, `export *` is permitted when the file has a single, obvious public concern (one component + its types) with no internals to leak. Use explicit named exports when a file exports multiple distinct things or has implementation details that should stay private. The trigger: if you would have to think about whether a new export should be public, use explicit exports.
  - ✅ GOOD: `data-access-layer/npcs/index.ts` — module directory, barrel required
  - ✅ GOOD: `export { useNpcs, useNpc } from './npcs'` in a grouping barrel — explicit named exports only, never `export *`
  - ❌ BAD: missing `data-access-layer/index.ts` — grouping barrels are unconditionally required, not optional
  - ❌ BAD: `export * from './npcKeys'` in `npcs/index.ts` — accidentally leaks internal query key factories; if `npcKeys` is public API, name it explicitly
- **Tests mirror file structure**: Test files live in a `__tests__/` subdirectory next to the code they test
  - Source: `helper/parseSearchTerms.ts` → Test: `helper/__tests__/parseSearchTerms.test.ts`
- Keep modules small for better separation of concerns
- Error handling: see `app/src/CLAUDE.md` — State Management & Error Handling

## Product

### Vision

Convinced of the transformative power and positive impact of table top role playing games (TTRPGs), the GM Tool makes crunchier systems like Dungeons and Dragons (D&D) more accessible for new audiences.

### Mission

Lowering the entry barrier for new Game Masters (GMs) and help experienced ones to avoid "GM fatigue"/burnout by guiding through the process of session preparation inspired by Michael Shea's "Return of the Lazy Dungeon Master". With an opinionated database structure, the GM Tool helps building an organic collection of non-player characters (NPCs), places, items, ect. and helps to track their influence on the story created with the players during game play.
