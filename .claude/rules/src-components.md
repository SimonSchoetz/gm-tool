---
paths:
  [
    "app/src/**/*.tsx",
    "src/**/*.tsx",
    "app/src/**/helper/**",
    "src/**/helper/**",
  ]
---

# Components under `src/`

Conventions for a file that renders JSX and for the `helper/` directories components own. Barrel and grouping-folder rules these build on are in `app/src/CLAUDE.md` — Barrel Files. A file under `screens/` or under `providers/` carries additional rules of its own: `.claude/rules/src-screens.md` and `.claude/rules/src-providers.md`.

## Icon imports

**Icon components imported from any third-party icon library are always bound to a name ending in `Icon`, even when the library's own exported name does not end that way.** Rename via the import alias when necessary (`import { Trash2 as Trash2Icon } from 'some-icon-library'`) — never bind the bare library name directly into JSX-consuming code. No single-use or plugin-local exception applies.

## Component Library

- Each component has its own folder.
- Functions that support a component must live in `ComponentName/helper/`, one file per function — never co-located in the component file itself, pure (transformations, formatters, predicates) or not (DOM/canvas mutation drivers). The exception is a function that reads the component's props or state directly, or calls a state setter, touches a ref or calls a hook (an event handler, a callback passed to JSX or a hook): it stays in the component file, but a computation inside it that produces a value and writes nothing (calls no state setter, touches no ref, calls no hook) moves to `helper/` once it has more than one statement or any branch, even at a single occurrence, taking the props, state and other values it reads as arguments (an `onDragEnd` handler deriving the reordered id list from `items`, `active` and `over` passes them as arguments and hands the result on). A branch is an `if`, a `switch`, an early return or a conditional expression (`?:`), the last counting inside a single expression too; `||`, `&&`, `??` and `?.` are not a branch, so a computation using only them stays inline unless it has more than one statement, while a `?:` inside one makes it a branch. Code that stays inline — a single expression without a branch, a bare read of props or state, or code that writes (the setter, ref and hook calls above; a DOM or canvas write is none of them, so it goes to `helper/` as a DOM mutation driver taking the element as an argument, and the handler calling it stays) — is extracted to `helper/` only at 2+ occurrences within the same component's file — list every occurrence as a call site to update. Structure mirrors the hooks pattern: `helper/helperA.ts` + `helper/__tests__/helperA.test.ts`.
- **Sub-component ownership**: near-identical JSX repeated 2+ times within a component, with only data-level variance between occurrences, is extracted to a sub-component. A sub-component (a function returning JSX, used exclusively within one parent) belongs in `ComponentName/components/`, where `ComponentName` is its immediate JSX parent — not any ancestor, at every nesting depth (a sub-component's sub-component belongs to its own `components/`, never the screen or top-level module's). When two or more unrelated parents render the same sub-component, it belongs to neither — place it as a peer module directory at the nearest shared ancestor (a standalone `components/SubComponentName/`, not nested under either consumer). **Exception — provider modules**: a component rendered exclusively by a provider still belongs in `components/`, not the provider's own module directory; `providers/` is infrastructure, and its `components/` (if any) holds only provider-internal structural fragments, not domain UI.
- A module's own `ComponentName/index.ts`, when it has one, never re-exports the contents of its `helper/` or `components/` folders — they are internal to the module.
- **A sub-component must never import a type back from the parent module that owns it.** When a parent and its `components/`-owned sub-component share a type, a child-to-parent import is a cycle in the module graph even when `import type` erases it and `tsc` passes. Extract the shared type to a neutral file both import from.

## Context scoped to one component

**A React context whose Provider is rendered by one component, for its own subtree, lives in that component's module directory — never in `providers/`.** The criterion is where the Provider renders: `providers/` holds contexts whose Provider wraps the app root (`.claude/rules/src-providers.md` — providers/). The shape is two files, with `X` a name for what the context carries: `XContext.ts` beside the providing component's main file, declaring `createContext<Value | null>(null)`, and `hooks/useX.ts` in the same module directory (a function-grouping folder, so no `index.ts` — `app/CLAUDE.md` — Directory Structure (all TypeScript layers)), which reads the context with `useContext`, throws when the value is `null`, and names the providing component in the error message. The context file imports nothing from the providing component or its sub-components, so a sub-component that imports the hook (which imports the context file) never closes an `import-x/no-cycle` cycle.

## Component Internals

**No IIFE or inline sub-components in JSX.** An IIFE inside a render return (`{(() => { ... })()}`) or a named function declared inside the component body that returns JSX are both signs extraction didn't happen. Logic returning a primitive → `helper/`; logic returning JSX → a sub-component in `components/`, exactly as if defined outside the parent file. An anonymous callback passed to an array method such as `.map` that returns JSX is neither of those two cases: the JSX it returns, including a `?:` that only chooses which element to return, stays inline and moves to `components/` only when the Sub-component ownership bullet of Component Library applies (near-identical JSX repeated 2+ times with only data-level variance). This narrows the Component Library `helper/` bullet for that JSX only: a computation inside such a callback that produces a non-JSX value still moves to `helper/` under that bullet. Exception: a function a third-party API takes as a render-prop and that needs the component's own hooks or props (Lexical's `menuRenderFn`) stays in the component body.

**A derived value or an event handler the JSX uses is declared as a named `const` above the return, and the JSX references it by name — never the expression or arrow function inline.** A derived value is an array-method result, a `?:`, a call or a built object or array; a `className` or `style` value is not one and stays in the JSX. It applies to every `src/**/*.tsx` component, enforced at `error` by `local/no-inline-jsx-values` for a JSX attribute value only: a value in children position (`{cond ? <A /> : null}`, `{items.map(…)}`) or a spread attribute stays inline. The Component Library `helper/` bullet applies to the const's body unchanged — a const the component already held included — except as the sentences below narrow it, and its "stays inline" means stays in the component file as this const. A value holding a handler stays whole there, its `?:` included, since a helper would hand back half of one value. A value whose branches nest JSX stays whole there too, since a `helper/` file holds no JSX; only its non-JSX computations move to `helper/`. A JSX-returning `.map` callback is not such a value and stays inline under the exception above, and so does a handler or value inside it that reads a variable declared inside the callback, its parameter or a local of its body (`onClick={() => onSelect(item.id)}`, a permitted transformation under "Pass props directly"); one that reads none is hoisted like any other. A bare prop or hook value stays a direct reference; a permitted wrapper under "Pass props directly" becomes a named const.

- ✅ above the return: `const mappedSteps = steps.map(…);`, `const onSelect = (stepId) => {…};` and `const newItemAction = session?.active_view === 'prep' ? { label: 'Add step', onClick: () => { void createStep(); } } : null;` — then `<ReorderableNavList items={mappedSteps} onSelect={onSelect} onReorder={bulkReorder} newItem={newItemAction} />`, `bulkReorder` being a bare hook value
- ❌ `<ReorderableNavList items={steps.map((step) => ({ … }))} onSelect={(stepId) => { … }} newItem={session?.active_view === 'prep' ? { … } : null} />`

**Pass props directly when no transformation, guard, renaming, or toolchain enforcement is needed — never wrap them in a named function that only forwards its argument unchanged; inline the prop reference instead** (`<Foo onMouseEnter={onMouseEnterBridge} />`, not `const handleMouseEnter = () => onMouseEnterBridge();` passed as the prop). Governs JSX prop wiring only — not hook return types or public API boundaries, where a wrapper hides implementation details and presents a domain-typed interface. Permitted wrapper cases: a transformation (`() => onClose(id)`), a guard (`() => { if (enabled) onSubmit() }`), a signature adapter (`(e: MouseEvent) => onSelect(e.currentTarget.dataset.id)`), or an active ESLint requirement (`() => { void handleAsync(); }` — `@typescript-eslint/no-misused-promises` discarding a Promise where a synchronous callback is expected).

**Before wiring a prop to any component you did not write in the current task, read its implementation file and verify the prop is forwarded to the element or sub-component where it takes effect.** This includes `ref` — under React 19, `ref` is an ordinary prop on function components, so a `ref` you did not personally forward is exactly the case this rule governs. A prop declared in a component's props type may not be forwarded internally, and a prop that is silently dropped or silently shadowed (see the `Omit` rule below) is a runtime no-op with no compiler or linter error. Verify before writing the JSX.

**Props pattern — three cases, pick exactly one:**

Selection is a strict gate — apply in order, stopping at the first match. The question at each step is "what does the root node render?", not "what props does the consumer currently pass?":

1. Does the root node render a native HTML element and forward attributes to it? → `HtmlProps<'element'>`
   - ✅ `type GlassPanelProps = { radius?: RadiusSize } & HtmlProps<'div'>`
   - ❌ `DivHTMLAttributes<HTMLDivElement>` or `React.HTMLProps<HTMLDivElement>` — always use the `HtmlProps` alias, never the raw React type

2. Does the root node render a specific existing component and stay in sync with its prop shape? → `React.ComponentProps<typeof Parent>`
   - ✅ `type Props = { buttonStyle?: 'danger' } & React.ComponentProps<typeof ActionContainer>`

3. Neither of the above? → `FCProps<Props>` — closed API. Always declare the props as a named `type Props = { ... }` and type the component assignment as `FCProps<Props>`.
   - ❌ `const SearchInput = ({ onSearch }: { onSearch: () => void }) => { ... }` — inline destructuring without FCProps
   - ❌ `const SearchInput: React.FC<Props> = ...` — use FCProps, not React.FC
   - **Zero-props exception:** when a case-3 component accepts no external props whatsoever, omit `FCProps<Props>` entirely (✅ `export const AdventureCrumb = () => { ... }`) — do not write `type Props = object`, `type Props = Record<string, never>`, or keep an empty/placeholder `FCProps<Props>`.

**A wrapper hardcoding a value for a prop inherited via `React.ComponentProps<typeof Parent>` (case 2 above) must `Omit` that prop from its own `Props` type.** Otherwise a caller can pass a value that is silently shadowed in JSX. Every hardcoded prop must be excluded, not just the first one added.

- ✅ `Omit<React.ComponentProps<typeof SyncedInput>, 'autoFocus' | 'className'>` when both are hardcoded

**Redundant HTML attributes:** Never write an HTML attribute whose value matches the browser default — omit it, the browser supplies it (❌ `<input type="text" />` → ✅ `<input />`). Non-default values are kept (✅ `<input type="checkbox" />`, `<button type="button" />`).

**A state a component shows only visually — a CSS class, or an element with no text — also carries accessible state, set from the same condition:** a role, an ARIA attribute or an `aria-label`. A text-less component shared across call sites carries it once, on its own root, so every call site has it (✅ `LoadingIcon` sets `role='img'` and `aria-label='Loading'` on its root). An element that only shows pointer-drag feedback (a drop line, a drop highlight) conveys nothing to an assistive-technology user who cannot perform that drag, so it carries `aria-hidden="true"` instead.

**Variant system:**

- Variants are expressed as a union type prop and applied via a CSS modifier class. Never express variants as inline styles. Never use one boolean prop per variant when the component has — or may grow — more than one variant.
  - ✅ `buttonStyle?: 'danger'` → `cn('button-wrapper', buttonStyle && \`button-wrapper--${buttonStyle}\`)`
  - ❌ `isDanger?: boolean; isPrimary?: boolean`

- **`cn()` usage — conditional and computed classes only:** Use `cn()` when class names are conditional or computed at runtime. One static string, or two or more static strings with no argument depending on a runtime condition (ternary, `&&`, a variable), must use `className="..."` directly — never `cn(...)` with every argument static.

**UI primitive wrappers — prefer the component over the bare HTML element.** Two match types apply, checked in order:

1. **Name-match**: a component in `src/components/` sharing the exact name of a native HTML element (PascalCase vs lowercase — e.g., `Input` / `<input>`) is always used instead of the bare element.
2. **Semantic-match**: before a typed variant of an HTML element (e.g., `<input type="color">`), check `src/components/` for a specialized component (naming pattern `[Modifier][ElementName]`, e.g. `ColorInput`, `DateInput`) — use it, never the generic wrapper with a `type` attribute.

## Component-scoped custom properties

When a CSS value cannot use a global token from `styles/variables/`, declare it as a CSS custom property on the component's root element — the prefix identifies its source. DB-sourced values (known only at runtime) are applied via an inline `style` prop, never as a direct inline style property, and prefixed `--rt-[component-name]-`; the CSS file then consumes the custom property via `var()`. When a component needs both a runtime custom property and a standard CSS property in the same `style` prop, both go in a single object cast — never split across two props or two casts. Static component-scoped values (e.g. a computed layout value set via JavaScript, or an intermediate calculation shared between CSS rules within the same component) are prefixed `--[component-name]-` (kebab-cased, no `rt` segment).

- ✅ `style={{ '--rt-component-xyz-color': color, width: size } as React.CSSProperties}` + CSS: `color: var(--rt-component-xyz-color)`

## Stylesheet import order

**A `.tsx` file's stylesheet imports are ordered by the cascade, never by tidiness.** Stylesheets load in import order, so when this file's own `.css` and a child component's `.css` set the same property on the same element at equal specificity, the one imported later wins. Import the file's own stylesheet before the imports of the child components whose stylesheets must override it, put an inline comment on it naming the tying rules, and when reordering imports never move a `.css` import across a component import.

- ✅ `FiveEStatBlockSectionBody.tsx`: `import './FiveEStatBlockSectionBody.css';` above the group component imports, because its `label` rules tie with the groups' and the groups must win

## Controlled inputs that drive auto-save mutations

**A controlled input bound to a server value that calls a mutation on change must never bind `value` directly to the query result** — TanStack Query re-fetching after invalidation causes the input to jump mid-keystroke. Case 1 — the element is (or wraps) `Input` and saves every keystroke's string as typed: use `SyncedInput` (`src/components/SyncedInput/SyncedInput.tsx`), which owns local display state via `useSyncedInputValue` and also adopts an external value change (a synced edit from a paired device) once the field isn't focused — a plain `useState` mirror of the query value handles the mid-keystroke jump but not that second-device case. Case 2 — anything else: an element other than `Input` (e.g. `DateInput`), or an `Input` whose save depends on the typed value or that reverts an unsaveable value on blur (a number input saving only a valid whole number), because `SyncedInput` takes no `onFocus` or `onBlur` and hands `onCommit` only the string. Wire `useSyncedInputValue`'s `value`, `setValue`, and `focusProps` onto that element directly, and call both `setValue` and the debounced updater from the change handler — the updater only for a saveable value, with `setValue` restoring the saved value on blur when the typed one is not saveable. The `?? ''` initializer is correct at this boundary: HTML inputs require a string, and the empty string represents "nothing displayed" — a distinct concept from the nullable DB column representing "nothing stored."

- ✅ GOOD (Case 1): `const onCommit = (value: string) => { updateWidget({ name: value }); }; <SyncedInput initValue={widget?.name ?? ''} onCommit={onCommit} />`
- ✅ GOOD (Case 2): `const { value, setValue, focusProps } = useSyncedInputValue(widget?.dueDate ?? ''); const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { setValue(e.target.value); updateWidget({ dueDate: e.target.value }); }; <DateInput value={value} onChange={onChange} {...focusProps} />`

## Framework context is not a prop

Never relay a value as a prop when the receiving component can obtain it directly from a framework-managed context. This prohibition covers data-fetching results, data-fetching callbacks, and routing context (URL params via `useParams`). Props are reserved for state that genuinely belongs to a parent: cross-component coordination such as tooltip visibility, modal open/close, or selection state shared between siblings. Pass a callback down only when the parent owns the coordination state and the child reports events up. If a component has a button, that component owns the button's action — it does not receive a callback from two levels up.

- ✅ GOOD: `StepSectionHeader` calls `useSession(sessionId)` directly (TanStack Query serves the cached value); `SessionHeader` calls `useParams()` directly and passes the result to `useSession`
