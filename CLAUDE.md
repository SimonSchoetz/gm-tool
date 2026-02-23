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

### Code styles and convention

#### Coding style

- typescript first
- types over interfaces
- use modern arrow function syntax
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
- **DRY (Don't Repeat Yourself)**: Always reuse existing functions instead of duplicating logic
  - If a function already exists that performs the needed operation, call it instead of reimplementing
  - Compose complex operations from existing simple functions
  - ❌ BAD: Duplicating database calls and state updates in multiple functions
  - ✅ GOOD: Calling existing `createImage()` and `deleteImage()` within `replaceImage()`
- **Re-derive types after every refactor**: After changing how a component or function gets its data, re-derive its types and props bottom-up from actual usage — never trust existing definitions at face value. A type field with no reader is wrong. A prop with no caller setting it is wrong.
  1. Trace every field in the props type to a value being set at the call site. If no caller sets it, remove it.
  2. Trace every field in internal types to a place where it is read and used. If a field is only defined but never accessed, it is dead code — remove it.
  - ❌ BAD: Keeping `render` on `ListColumn<T>` after a refactor because it was there before, without checking if any caller sets it or any reader accesses it
  - ✅ GOOD: After refactor, scanning every field of `ListColumn<T>` and finding `render` is never called → remove the field and the dead branch

### Third-Party Libraries

Never assume training knowledge is current for third-party libraries. Before suggesting or implementing anything that depends on a specific library API, version, or feature:

1. Check the installed version in `package.json`
2. Fetch the official documentation for that exact version from the internet
3. If documentation is ambiguous or unavailable, ask before proceeding

This applies especially to: TanStack Query, TanStack Router, Lexical, Tauri, and Drizzle.

#### File Organization

- **1 concern → 1 file**: A concern is defined by domain ownership, not operation type or access shape. Everything that belongs to the same domain entity belongs in the same file or module — splitting by singular/plural query, or by read/write, fragments cohesion without benefit.
  - ✅ GOOD: `NpcProvider` owns all NPC query keys, mutations, and access patterns — `useNpc` and `useNpcs` are thin access hooks that delegate to it
  - ✅ GOOD: `create.ts`, `get.ts`, `remove.ts` at the DB layer — each is an independent public operation on a different concern (creation vs. retrieval vs. deletion)
  - ✅ GOOD: `allTermsMatchItem.ts` containing private `getSearchableText` and `termMatchesItem` — they exist only to support `allTermsMatchItem`
  - ❌ BAD: `utils.ts` with unrelated helpers dumped together
  - ❌ BAD: Moving all NPC mutation logic into `useNpc.ts` and `useNpcs.ts` and deleting `NpcProvider` — query key ownership is now split across two files with no shared invalidation surface
- **Export via barrel file**: Each module directory exposes its public API through an `index.ts`. Use `export *` only when a file has a single, obvious public concern (one component + its types) — there are no internals to accidentally leak. Use explicit named exports when a file exports multiple distinct things, or when some exports are internal implementation details that should not be public. The trigger: if you would have to think about whether a new export from that file should be public, use explicit exports.
  - ✅ GOOD: `export *` from a single-component file — one concern, nothing to hide
  - ✅ GOOD: Explicit named exports from a provider module — deliberately signals what is stable API (e.g. `npcKeys` exported = "safe to use for external invalidation")
  - ❌ BAD: `export * from './NpcProvider'` in the barrel — accidentally makes internal query key factories public without a deliberate decision
- **Tests mirror file structure**: Test files live in a `__tests__/` subdirectory next to the code they test
  - Source: `helper/parseSearchTerms.ts` → Test: `helper/__tests__/parseSearchTerms.test.ts`
- Keep modules small for better separation of concerns
- Error handling: see `app/src/CLAUDE.md` — State Management & Error Handling

## Product

### Vision

Convinced of the transformative power and positive impact of table top role playing games (TTRPGs), the GM Tool makes crunchier systems like Dungeons and Dragons (D&D) more accessible for new audiences.

### Mission

Lowering the entry barrier for new Game Masters (GMs) and help experienced ones to avoid "GM fatigue"/burnout by guiding through the process of session preparation inspired by Michael Shea's "Return of the Lazy Dungeon Master". With an opinionated database structure, the GM Tool helps building an organic collection of non-player characters (NPCs), places, items, ect. and helps to track their influence on the story created with the players during game play.
