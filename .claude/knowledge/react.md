# React

## `recursivelyTraverseDeletionEffects` deletes sibling subtrees left-to-right in render order — a later sibling's DOM removal always commits after an earlier sibling's ref cleanup and host-node removal

**Verified at:** react-dom 19.3.0

**Citation:** [spec-writer_1: app/node_modules/react-dom/cjs/react-dom-client.development.js:15403-15415 — `recursivelyTraverseDeletionEffects` iterates `parent.child`, then walks `.sibling` in a `for` loop, calling `commitDeletionEffectsOnFiber` on each in that order; :15479-15528 — for a host component (`case 5`, falling through to `case 6`) `commitDeletionEffectsOnFiber` calls `safelyDetachRef` (ref cleanup) before recursing into the fiber's own children, and calls `removeChild`/`removeChildFromContainer` for the fiber after that recursion completes]

For the children of a fiber being deleted, React's commit-phase deletion traversal processes them in the same left-to-right order they were rendered (JSX child order) — the first sibling's ref cleanup and DOM `removeChild` calls complete before the traversal moves to the next sibling. This means a component whose unmount must run — and specifically must finish removing its own DOM nodes — before a sibling's unmount side effects fire (e.g. a portal target that a later sibling's ref-cleanup callback mutates or clears) must be rendered earlier in the same JSX tree, not later. See `.claude/knowledge/lexical.md` — "`LexicalEditor.setRootElement(nextRootElement)` wipes the previous root element's DOM children..." for the concrete case this was verified against.

## `JSX.IntrinsicElements['input']` already carries `ref` through `RefAttributes`, so a type built on it needs no `forwardRef` to accept one

**Verified at:** react 19.3.0, @types/react 19.3.0

**Citation:** [spec-writer_1: app/node_modules/@types/react/index.d.ts:4318 — `input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;`; :2352 — `type DetailedHTMLProps<E extends HTMLAttributes<T>, T> = ClassAttributes<T> & E;`; :307 — `interface ClassAttributes<T> extends RefAttributes<T> {}`; :293-302 — `interface RefAttributes<T> extends Attributes { ref?: Ref<T> | undefined; }`; app/node_modules/react/package.json — `"version": "19.3.0"`]

The DOM element prop types already declare `ref`: every `JSX.IntrinsicElements[T]` resolves through `DetailedHTMLProps` → `ClassAttributes` → `RefAttributes`, which declares `ref?: Ref<T> | undefined`.

## `React.ChangeEvent<HTMLInputElement>.target.selectionStart` is typed `number | null`

**Verified at:** typescript lib.dom.d.ts, loaded via `"lib": ["ESNext", "DOM", "DOM.Iterable"]` in app/tsconfig.json:5

**Citation:** [spec-writer_29: app/node_modules/typescript/lib/lib.dom.d.ts, `interface HTMLInputElement` — `selectionEnd: number | null;` and `selectionStart: number | null;`; `setSelectionRange(start: number | null, end: number | null, direction?: SelectionDirection): void;`; `setRangeText(replacement: string, start: number, end: number, selectionMode?: SelectionMode): void;`]

`selectionStart`/`selectionEnd` are nullable on `HTMLInputElement` — they read `null` for input types that do not support text selection. Any caret arithmetic reading them must narrow before use; under `tseslint.configs.strictTypeChecked` an unnarrowed read is a type error, not a warning. `setSelectionRange` accepts nullable arguments, takes an optional `SelectionDirection`, and returns `void`. `setRangeText` also exists and combines range replacement with selection placement, but it mutates the DOM node's value directly and is therefore unsuitable for a React controlled input, whose next render overwrites the DOM value from state.

## React may throw away a `useMemo` cached value; that should be fine if `useMemo` is relied on solely as a performance optimization, and otherwise a state variable or a ref may be more appropriate

**Verified at:** <https://react.dev/reference/react/useMemo>, fetched 2026-09-21
**Citation:** [head-of-instructions_36: https://react.dev/reference/react/useMemo — fetched 2026-09-21 — read, Usage > Skipping expensive recalculations: "You should only rely on `useMemo` as a performance optimization"; Caveats: "React will not throw away the cached value unless there is a specific reason to do that", "This should be fine if you rely on `useMemo` solely as a performance optimization. Otherwise, a state variable or a ref may be more appropriate."]

React keeps a memoized value unless it has a specific reason to throw the cache away: in development when the component's file is edited, in development and production when the component suspends during its initial mount, and possibly for more reasons in future. The page says relying on `useMemo` solely as a performance optimization should be fine, and that otherwise a state variable or a ref may be more appropriate.

## React calls a `useState` initializer function twice in development Strict Mode and ignores the result of one call, and says the initializer should be pure

**Verified at:** <https://react.dev/reference/react/useState>, fetched 2026-09-21
**Citation:** [head-of-instructions_37: https://react.dev/reference/react/useState — fetched 2026-09-21 — read, Usage > Avoiding recreating the initial state: "If you pass a function to `useState`, React will only call it during initialization", "React saves the initial state once and ignores it on the next renders"; Parameters (`useState(initialState)`): "It should be pure, should take no arguments, and should return a value of any type"; Caveats (`useState(initialState)`): "In Strict Mode, React will call your initializer function twice in order to help you find accidental impurities", "The result from one of the calls will be ignored"]

If a function is passed to `useState`, React calls it only during initialization; the initial state is saved once and ignored on later renders. In Strict Mode it calls the initializer function twice in development, to help find accidental impurities, and ignores the result of one call; the page says the initializer should be pure.

## In `@types/react`, `Ref<T>` is `RefCallback<T> | RefObject<T | null> | null`, so `null` is itself a valid `Ref<T>`

**Verified at:** @types/react 19.3.0
**Citation:** [spec-writer_1: app/node_modules/@types/react/index.d.ts:194 — `type Ref<T> = RefCallback<T> | RefObject<T | null> | null`]

A prop typed `Ref<HTMLButtonElement>` accepts a literal `null` as well as a `RefObject<HTMLButtonElement | null>`.

## In `@types/react`, `createContext` has a single signature, and it requires a default value

**Verified at:** @types/react 19.3.0
**Citation:** [spec-writer_1: grep -c "function createContext" app/node_modules/@types/react/index.d.ts — 1 found] [spec-writer_2: app/node_modules/@types/react/index.d.ts:716-720 — `function createContext<T>(defaultValue: T): Context<T>`]

Calling `createContext<T>()` with no argument does not type-check.

## In `@types/react`, `Context<T>` extends `Provider<T>` and also declares a `Provider: Provider<T>` property

**Verified at:** @types/react 19.3.0
**Citation:** [spec-writer_1: app/node_modules/@types/react/index.d.ts:678-679 — `interface Context<T> extends Provider<T> { Provider: Provider<T>; ...`]

`Provider<T>` is the type of both the context object and its `Provider` property.
