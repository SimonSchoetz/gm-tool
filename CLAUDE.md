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

### Code styles and convention

#### Coding style

- typescript first
- types over interfaces
- Use modern arrow function syntax. Classes are permitted only where a third-party framework API requires inheritance — e.g., Lexical node types (extending `DecoratorNode`, `TextNode`, etc.) and `MenuOption` subclasses. Do not introduce classes for any other reason.
- never return undefined, it should be an indicator for errors
- avoid using `any` as type
- Use descriptive names instead of comments
  ❌ BAD: `const data = await fetch(); // Get user data`
  ✅ GOOD: `const userData = await fetchUserData();`
- Use modern JavaScript operators for cleaner code:
  ❌ BAD: `const x = value !== undefined ? value : defaultValue`
  ✅ GOOD: `const x = value ?? defaultValue`
  ❌ BAD: `if (obj && obj.prop && obj.prop.nested) { ... }`
  ✅ GOOD: `if (obj?.prop?.nested) { ... }`
- use single quotes
- multiple array/object items in new lines

### Accountability on Missed Requirements

When caught having missed a rule, a test, a cleanup item, or anything that CLAUDE.md or project conventions required, do not stop at acknowledging the miss. On the first pushback — before being asked again — immediately provide all four of the following:

1. **Which rule applies** — cite it exactly and state why it is not scoped to a subset of cases (i.e., why it applied here).
2. **Why it was missed** — not what was wrong in the output, but what went wrong in the reasoning process that produced the miss.
3. **The wrong mental model** — the assumption or shortcut that caused the reasoning to fail.
4. **The correct mental model** — the replacement belief or check that would have caught it.

The first pushback is the prompt. Do not wait for a second or third before providing this analysis.

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
- **Re-derive types after every refactor**: After changing how a component or function gets its data, re-derive its types and props bottom-up from actual usage — never trust existing definitions at face value. A type field with no reader is wrong. A prop with no caller setting it is wrong.
  1. Trace every field in the props type to a value being set at the call site. If no caller sets it, remove it.
  2. Trace every field in internal types to a place where it is read and used. If a field is only defined but never accessed, it is dead code — remove it.
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
- **Run `npx tsc` once per sub-feature, not after every individual file edit.** Type-check after all files for a sub-feature are written, immediately before marking that sub-feature complete. Running it after every file wastes round-trips and produces noise from intentionally incomplete intermediate states.

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
