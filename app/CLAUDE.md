# App

Conventions that apply across `app/` — TypeScript conventions for all TypeScript layers (`src/`, `services/`, `domain/`), and external-dependency verification procedures (npm, Rust crates, Tauri config) spanning the whole `app/` tree including `src-tauri/`.

## TypeScript Coding Style

- Use modern arrow function syntax. Classes are permitted only where a third-party framework API requires inheritance — e.g., Lexical node types (extending `DecoratorNode`, `TextNode`, etc.) and `MenuOption` subclasses. Do not introduce classes for any other reason.
- **Error types use factory functions, not classes.** Create typed errors with a factory function and type narrowing — never `class XxxError extends Error`. `instanceof` is not used in this codebase — all errors route to the Error Boundary via `throwOnError: true`.

  ```ts
  // ✅ GOOD
  export type SessionLoadError = Error & { name: 'SessionLoadError' };
  export const sessionLoadError = (cause?: unknown): SessionLoadError => {
    const error = new Error(`Failed to load sessions: ${String(cause)}`) as SessionLoadError;
    error.name = 'SessionLoadError';
    return error;
  };

  // ❌ BAD
  export class SessionLoadError extends Error { ... }
  ```

- **This rule governs domain errors — errors a caller or the Error Boundary is expected to catch, narrow by `name`, or handle differently based on type.** A bare `throw new Error(...)` for an internal, should-never-happen invariant — a defensive assertion with no caller expected to catch or narrow it by type, such as a DOM-shape invariant inside a low-level framework node override — does not define an error type and is not required to use the factory pattern. When it is unclear whether a thrown error might need caller-side narrowing later, surface the ambiguity rather than deciding unilaterally — do not silently default to either form.

- Never use `undefined` as a value in business logic — not as a return type, not as a local variable initializer, and not in a union type for a local variable that represents domain state. Use `null` for "no value yet" and explicit error types for error states. `undefined` is a language default — its presence in domain code signals a missing initialization decision.
  - ❌ BAD: `let session: Session | undefined;`
  - ✅ GOOD: `let session: Session | null = null;`

- **In any function typed `void` — whether annotated explicitly or inferred from a `void` return-type slot in a containing type — use a bare `return;` for early exits. Never use `return null;` as an early exit in a void context.** `return null;` implies a return value exists and misleads readers into looking for a consumer; bare `return;` correctly signals "stop here, nothing is returned."
  - ❌ BAD: `const updateItem = (data: UpdateItemData) => { if (!itemData) return null; ... }` where `updateItem` is typed `() => void`
  - ✅ GOOD: `const updateItem = (data: UpdateItemData) => { if (!itemData) return; ... }`

- **Banned TypeScript forms — enforced by the strict ESLint preset (`tseslint.configs.strictTypeChecked`), not visible as named rules in `eslint.config.js`:**
  - `Array<T>` — always use the `T[]` shorthand instead.
    - ❌ `Array<string>`
    - ✅ `string[]`
  - `useRef<T>(value)` when `T` is directly inferrable from the initializer — omit the annotation.
    - ❌ `useRef<number>(0)` — `number` is fully inferrable from `0`
    - ✅ `useRef(0)`
    - Note: DOM refs initialised with `null` require the explicit type argument (`useRef<HTMLDivElement | null>(null)`) — without it TypeScript infers `RefObject<null>`, not `RefObject<HTMLDivElement | null>`. That annotation is not redundant and must be kept.

- **When a file is moved or promoted to a new location, update all consumers to import from the new location — never introduce a re-export in the old barrel solely to preserve existing import paths.** A backward-compat re-export hides the migration and leaves consumers pointing at a stale path through an indirection layer — imports must reflect where symbols actually live.
  - ❌ BAD: Adding `export { getDateTimeString } from '@util/getDateTimeString'` to `src/util/index.ts` so existing callers do not need updating
  - ✅ GOOD: Remove the barrel re-export; update every consumer to import from the new location directly
- **Code in any artifact must be valid under the project's full toolchain configuration, not just type-declaration correct.** Verify against the active `tsconfig.json` compiler flags and `eslint.config.js` plugin rules before writing code that depends on them. Three error classes pass symbol verification but fail at toolchain time: (1) tsc narrowing mechanics — tsc narrows variables, not re-evaluated call expressions; store the result in a `const` before the guard; (2) strictness flags — e.g. `exactOptionalPropertyTypes` rejects assigning `T | undefined` to an optional property typed `T`; (3) ESLint plugin rules — e.g. `react-hooks/refs` bans reading `ref.current` inside a render callback. Training knowledge of what TypeScript or ESLint permits in the abstract is never sufficient.

## Directory Structure (all TypeScript layers)

Two directory types exist — distinguish them before adding or deleting a barrel:

- **Module directory**: owns a single table or concern. Always exposes its public API through an `index.ts`. This barrel is required.
- **Grouping folder**: organizes module directories but owns no domain itself. Requires an `index.ts` barrel with explicit named exports — `export *` is banned in grouping barrels. **Exception**: when the owning layer's own CLAUDE.md documents both the grouping barrel and direct `<layer>/<subdomain>` imports as equally sanctioned external import paths (a documented dual-path convention — see `domain/CLAUDE.md` — Imports), the subdomain's own barrel is already the full, curated public-API statement, and the grouping barrel's block for that subdomain may use `export * from './<subdomain>'` instead of hand-copying its name list — re-listing identical names adds a second hand-maintained copy with no curation value. This exception does not apply to a grouping folder that is the sole sanctioned external import path for its layer (e.g. `src/`'s `components/`, `providers/`, `data-access-layer/`, `util/`, `hooks/`, `screens/`, `types/`, per `src/CLAUDE.md`).

This distinction applies in `src/`, `services/`, and `domain/`. Layer-specific applications of this rule (which directories are grouping folders, import depth conventions) are documented in each layer's own CLAUDE.md.

- **Verify import paths resolve from the importer's location and use the correct form.** Resolve the path from the file that will contain the import — not from a feature root — and confirm it reaches a specific file, not a directory. A path whose last two segments repeat the same name (`ComponentName/ComponentName`) is the double-name anti-pattern: use the barrel when one exists; when no barrel exists and a grouping barrel would be circular, the explicit file path is the only valid form and is correct.

## File Organization

**1 concern → 1 file**: A concern is defined by domain ownership, not operation type or access shape. Everything that belongs to the same domain entity belongs in the same file or module — splitting by singular/plural query, or by read/write, fragments cohesion without benefit.

- ✅ GOOD: `create.ts`, `get.ts`, `remove.ts` at the DB layer — each is an independent public operation on a different concern (creation vs. retrieval vs. deletion)
- ✅ GOOD: `allTermsMatchItem.ts` containing private `getSearchableText` and `termMatchesItem` — they exist only to support `allTermsMatchItem`
- ❌ BAD: `utils.ts` with unrelated helpers dumped together

Error handling: see `app/src/CLAUDE.md` — State Management & Error Handling.

## Convention Discovery

**Before introducing a new instance of a recurring pattern, grep for the existing convention independently — do not rely solely on a spec's cited references.** A spec's Key Architectural Decisions may validate new code only against the conventions it explicitly names. Any recurring codebase pattern not named in the spec (naming suffixes, file placement conventions, prop shapes) must still be discovered and matched. Before writing code that introduces a new instance of something already done repeatedly elsewhere (e.g., a new icon import in `src/`, a new hook, a new error factory in `domain/`, a new service composition pattern in `services/`), search the codebase for at least one existing instance of that same kind of thing and match its convention — even when no reference implementation was named for it.

## Domain Glossary

Entity vocabulary grounded in the actual database schema (`db/*/schema.ts`). Every entity below is scoped to a single Adventure via `adventure_id` unless noted otherwise.

| Term                       | Meaning                                                                                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adventure                  | Top-level campaign container. Owns all other entities.                                                                                                                                                                                       |
| Session                    | A single game session within an Adventure. Tracks `active_view` (`prep` or `ingame`) and owns an ordered set of Session Steps.                                                                                                               |
| Session Step               | One prep checklist item within a Session, keyed to Michael Shea's Lazy Dungeon Master steps: reviewing characters, a strong start, potential scenes, secrets and clues, fantastic locations, important NPCs, relevant monsters, magic items. |
| NPC (non-player character) | A character controlled by the GM.                                                                                                                                                                                                            |
| PC (player character)      | A character controlled by a player.                                                                                                                                                                                                          |
| Foe                        | An antagonist or monster.                                                                                                                                                                                                                    |
| Faction                    | An organization or group within the Adventure's world.                                                                                                                                                                                       |
| Location                   | A place within the Adventure's world.                                                                                                                                                                                                        |
| Item                       | An object — e.g. equipment or a magic item — within the Adventure.                                                                                                                                                                           |
| Image                      | A shared asset referenced by `image_id` across Adventures, NPCs, PCs, Foes, Factions, Locations, and Items.                                                                                                                                  |
| Table Config               | Shared infrastructure controlling per-table display settings (color, tagging, scope, layout). Not a narrative entity.                                                                                                                        |

## Third-Party Libraries

The general verification obligation in root `CLAUDE.md`'s Epistemological Discipline section applies to all external systems. For **npm packages specifically**, the lookup procedure is:

1. Check the installed version in `package.json`
2. Fetch the official documentation for that exact version from the internet
3. If documentation is ambiguous or unavailable, ask before proceeding

This applies especially to: TanStack Query, TanStack Router, Lexical, Tauri, and Drizzle.

To inspect what a library actually exports, use Read or Glob on its `index.d.ts` (e.g. `node_modules/<package>/dist/index.d.ts`). Never use `node -e` or any runtime introspection — type declarations are the authoritative source and require no execution.

For **ambient/global runtime types specifically** (DOM API, ES built-ins, and other globals available without an import statement) — these are not tied to any single npm package's `dist/index.d.ts`; they ship inside the TypeScript compiler's own `lib` files (`node_modules/typescript/lib/lib.*.d.ts`, e.g. `lib.dom.d.ts` for the DOM API), selected by the `lib` array in `tsconfig.json`. Read the specific `lib.*.d.ts` file directly to confirm a type's actual shape before asserting it — training-data familiarity with a well-known global API is not verification, and a supertype's signature does not apply to a subtype that narrows it via its own override.

- ✅ GOOD: confirming `HTMLElement.textContent` returns `string` (not `string | null`) by reading `lib.dom.d.ts`'s `Element` getter override, rather than assuming `Node.textContent`'s nullable signature applies down the inheritance chain
- ❌ BAD: asserting `domNode.textContent ?? ''` in a spec because `Node.textContent` is commonly known to be nullable, without checking whether the concrete type in use (`HTMLElement`) overrides that signature

For **Rust crates specifically** (dependencies in `app/src-tauri/Cargo.toml`), the lookup procedure is:

1. Check the installed version in `Cargo.toml` (or `Cargo.lock` for the resolved version when a range is specified)
2. Fetch docs.rs for that exact version — confirm the version segment in the URL matches before treating anything on the page as authoritative
3. If documentation is ambiguous or unavailable, ask before proceeding

To inspect what a crate actually exports or how a specific API is shaped, read its source directly from the local Cargo registry (`~/.cargo/registry/src/<crate>-<version>/`, resolved from `Cargo.lock`) — this mirrors using `index.d.ts` for npm packages above, and is version-exact by construction with no manual version-matching step, unlike docs.rs. Prefer local source over docs.rs for any concrete signature question (a function's parameters, a type's fields, a trait's methods); reserve docs.rs for narrative usage guidance the source itself doesn't cover.

For **Tauri configuration values** (`tauri.conf.json` and related config files): locate the `$schema` field (e.g. `"$schema": "https://schema.tauri.app/config/2"`), fetch the JSON schema at that URL, and read the accepted enum strings directly from the schema — never infer them from prose documentation, which may use colloquial language that does not match the schema's declared values.
