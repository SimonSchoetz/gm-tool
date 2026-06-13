# App

TypeScript conventions that apply to all TypeScript layers under `app/` (`src/`, `services/`, `domain/`).

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

## Directory Structure (all TypeScript layers)

Two directory types exist — distinguish them before adding or deleting a barrel:

- **Module directory**: owns a single table or concern. Always exposes its public API through an `index.ts`. This barrel is required.
- **Grouping folder**: organizes module directories but owns no domain itself. Requires an `index.ts` barrel with explicit named exports — `export *` is banned in grouping barrels.

This distinction applies in `src/`, `services/`, and `domain/`. Layer-specific applications of this rule (which directories are grouping folders, import depth conventions) are documented in each layer's own CLAUDE.md.
