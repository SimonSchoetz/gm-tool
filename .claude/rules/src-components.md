---
paths: ["app/src/**/*.tsx", "src/**/*.tsx", "app/src/**/helper/**", "src/**/helper/**"]
---

# Components under `src/`

Conventions for a file that renders JSX and for the `helper/` directories components own. Barrel and grouping-folder rules these build on are in `app/src/CLAUDE.md` — Barrel Files. A file under `screens/` or under `providers/` carries additional rules of its own: `.claude/rules/src-screens.md` and `.claude/rules/src-providers.md`.

## Icon imports

**Icon components imported from any third-party icon library are always bound to a name ending in `Icon`, even when the library's own exported name does not end that way.** Rename via the import alias when necessary (`import { Trash2 as Trash2Icon } from 'some-icon-library'`) — never bind the bare library name directly into JSX-consuming code. No single-use or plugin-local exception applies.

- ✅ GOOD: `import { CalendarIcon } from 'lucide-react';`
- ❌ BAD: `import { Calendar } from 'lucide-react';`

## Component Library

- Each component has its own folder.
- A component has its own `.css` file only when it owns styles of its own — see `app/src/CLAUDE.md` — Styles for the full rule and the sub-component CSS-extraction convention.
- Functions that support a component must live in `ComponentName/helper/`, one file per function — never co-located in the component file itself. This covers both pure functions (transformations, formatters, predicates) and non-pure helpers (DOM/canvas mutation drivers). Structure mirrors the hooks pattern: `helper/helperA.ts` + `helper/__tests__/helperA.test.ts`. Extraction triggers once a multi-statement body, or a single expression, reaches 2+ occurrences within the same component's file — list every occurrence as a call site to update.
- **Sub-component ownership**: near-identical JSX repeated 2+ times within a component, with only data-level variance between occurrences, is extracted to a sub-component. A sub-component (a function returning JSX, used exclusively within one parent) belongs in `ComponentName/components/`, where `ComponentName` is its immediate JSX parent — not any ancestor, at every nesting depth (a sub-component's sub-component belongs to its own `components/`, never the screen or top-level module's). When two or more unrelated parents render the same sub-component, it belongs to neither — place it as a peer module directory at the nearest shared ancestor (a standalone `components/SubComponentName/`, not nested under either consumer). **Exception — provider modules**: a component rendered exclusively by a provider still belongs in `components/`, not the provider's own module directory; `providers/` is infrastructure, and its `components/` (if any) holds only provider-internal structural fragments, not domain UI.
  - ❌ `providers/PinnedPopupsProvider/components/MentionPopup/` — belongs in `components/MentionPopup/` even when a provider is the sole renderer
- `helper/` and `components/` are within-module grouping barrels per `app/src/CLAUDE.md` — Barrel Files, with one addition: never re-export their contents from the parent `ComponentName/index.ts` — they are internal to the module. A sub-component directory within `components/` only needs its own `index.ts` when it has internal sub-structure (its own `helper/` or `components/` subdirectory); a flat single-file sub-component is exported directly from the `components/` barrel.
  - ✅ `export { AvatarCell } from './AvatarCell/AvatarCell'` in `components/index.ts` — flat sub-component, no sub-directory barrel needed
  - ✅ `SortableListItem/components/AvatarCell/index.ts` exists only if `AvatarCell/` grows its own `helper/` or `components/`
  - ❌ `export * from './components'` in `ComponentName/index.ts` — the `components/` barrel is internal, never re-exported upward
- **The ban on importing a sibling through the grouping folder's own barrel** — stated for every layer in `app/CLAUDE.md` — Directory Structure (all TypeScript layers) — applies to `src/components/` and to every screen-local `components/` folder:
  - ❌ `import { GlassPanel } from '@/components'` — circular: `MentionPopup` is inside `src/components/`, which exports it; importing through `@/components` from within that folder closes the cycle
  - ✅ `import { GlassPanel } from '../GlassPanel/GlassPanel'` — direct relative path, no barrel involved
  - A screen-local `screenName/components/` grouping folder importing a sibling through `../components` is the same cycle.
- **A sub-component must never import a type back from the parent module that owns it.** When a type is used by both a parent and its `components/`-owned sub-component, the parent-owns-child direction makes a child-to-parent import a cycle in the module graph, even when `import type` erases it at compile time with no `tsc` error. Extract the shared type to a neutral file both import from — never have the sub-component reach back into the parent's file.
  - ❌ `TableEdgeHint.tsx` (in `TableEdgeHandlePlugin/components/`) importing `HintDirection` via `import type { HintDirection } from '../../TableEdgeHandlePlugin'` — backwards even though it compiles
  - ✅ Declare `HintDirection` in a neutral file (e.g. `TableEdgeHandlePlugin/types.ts`), imported by both `TableEdgeHandlePlugin.tsx` and `TableEdgeHint.tsx`

## Component Internals

**No IIFE or inline sub-components in JSX.** An IIFE inside a render return (`{(() => { ... })()}`) or a named function declared inside the component body that returns JSX are both signs extraction didn't happen. Logic returning a primitive → `helper/`; logic returning JSX → a sub-component in `components/`, exactly as if defined outside the parent file — declaring it inline does not exempt it from the ownership rule.

**Pass props directly when no transformation, guard, renaming, or toolchain enforcement is needed — never wrap them in a named function that only forwards its argument unchanged; inline the prop reference instead.** Governs JSX prop wiring only — not hook return types or public API boundaries, where a wrapper hides implementation details and presents a domain-typed interface. Permitted wrapper cases: a transformation (`() => onClose(id)`), a guard (`() => { if (enabled) onSubmit() }`), a signature adapter (`(e: MouseEvent) => onSelect(e.currentTarget.dataset.id)`), or an active ESLint requirement (`() => { void handleAsync(); }` — `@typescript-eslint/no-misused-promises` discarding a Promise where a synchronous callback is expected).

- ❌ BAD: `const handleMouseEnter = () => onMouseEnterBridge(); <Foo onMouseEnter={handleMouseEnter} />`
- ✅ GOOD: `<Foo onMouseEnter={onMouseEnterBridge} />`

**Before wiring a prop to any component you did not write in the current task, read its implementation file and verify the prop is forwarded to the element or sub-component where it takes effect.** This includes `ref` — under React 19, `ref` is an ordinary prop on function components, not separate infrastructure, so a `ref` you did not personally forward is exactly the case this rule governs. A prop declared in a component's props type may not be forwarded internally — TypeScript types describe the interface surface, not the internal wiring. A prop that is silently dropped or silently shadowed (see the `Omit` rule below) is a runtime no-op with no compiler or linter error either way. Verify before writing the JSX; do not defer it to code review.

**Props pattern — three cases, pick exactly one:**

Selection is a strict gate — apply in order, stopping at the first match. The question at each step is "what does the root node render?", not "what props does the consumer currently pass?":

1. Does the root node render a native HTML element and forward attributes to it? → `HtmlProps<'element'>`
   - ✅ `type GlassPanelProps = { radius?: RadiusSize } & HtmlProps<'div'>`
   - ❌ `DivHTMLAttributes<HTMLDivElement>` or `React.HTMLProps<HTMLDivElement>` — always use the `HtmlProps` alias, never the raw React type

2. Does the root node render a specific existing component and stay in sync with its prop shape? → `React.ComponentProps<typeof Parent>`
   - ✅ `type Props = { buttonStyle?: 'danger' } & React.ComponentProps<typeof ActionContainer>`

3. Neither of the above? → `FCProps<Props>` — closed API. Always declare the props as a named `type Props = { ... }` and type the component assignment as `FCProps<Props>`.
   - ✅ `type Props = { onSearch: (term: string) => void; placeholder?: string }; export const SearchInput: FCProps<Props> = ({ onSearch, placeholder }) => { ... }`
   - ❌ `const SearchInput = ({ onSearch }: { onSearch: () => void }) => { ... }` — inline destructuring without FCProps
   - ❌ `const SearchInput: React.FC<Props> = ...` — use FCProps, not React.FC
   - **Zero-props exception:** when a case-3 component accepts no external props whatsoever, omit `FCProps<Props>` entirely (✅ `export const AdventureCrumb = () => { ... }`) — do not write `type Props = object`, `type Props = Record<string, never>`, or keep an empty/placeholder `FCProps<Props>` (❌ `export const AdventureCrumb: FCProps<Props> = () => { ... }`).

**A wrapper hardcoding a value for a prop inherited via `React.ComponentProps<typeof Parent>` (case 2 above) must `Omit` that prop from its own `Props` type.** Otherwise a caller can pass a value that is silently shadowed in JSX — see the prop-wiring rule above. Every hardcoded prop must be excluded, not just the first one added.

- ✅ `Omit<React.ComponentProps<typeof SyncedInput>, 'autoFocus' | 'className'>` when both are hardcoded
- ❌ `Omit<...,'autoFocus'>` only, while `className` is also hardcoded in JSX

**Redundant HTML attributes:** Never write an HTML attribute whose value matches the browser default. Omit it entirely — the browser supplies the default and the attribute adds no information.

- ❌ `<input type="text" />` → ✅ `<input />` — `type="text"` is the default
- ✅ `<input type="checkbox" />`, `<button type="button" />` — non-default values are kept

**Variant system:**

- Variants are expressed as a union type prop and applied via a CSS modifier class. Never express variants as inline styles. Never use one boolean prop per variant when the component has — or may grow — more than one variant.
  - ✅ `buttonStyle?: 'danger'` → `cn('button-wrapper', buttonStyle && \`button-wrapper--${buttonStyle}\`)`
  - ❌ `isDanger?: boolean; isPrimary?: boolean`
  - ❌ `style={{ color: 'red' }}` to express a variant

- **`cn()` usage — conditional and computed classes only:** Use `cn()` when class names are conditional or computed at runtime. One static string, or two or more static strings with no argument depending on a runtime condition (ternary, `&&`, a variable), must use `className="..."` directly — never `cn(...)` with every argument static.
  - ✅ GOOD: `cn('button-wrapper', buttonStyle && \`button-wrapper--${buttonStyle}\`)` — conditional, cn() is correct
  - ❌ BAD: `cn('button-wrapper')` — single static string, cn() adds no value; use `className="button-wrapper"` directly
  - ❌ BAD: `cn('button-wrapper', 'button-wrapper--active')` — two static strings, no conditional; use `className="button-wrapper button-wrapper--active"` directly

**UI primitive wrappers — prefer the component over the bare HTML element.** Two match types apply, checked in order:

1. **Name-match**: a component in `src/components/` sharing the exact name of a native HTML element (PascalCase vs lowercase — e.g., `Input` / `<input>`) is always used instead of the bare element.
2. **Semantic-match**: before a typed variant of an HTML element (e.g., `<input type="color">`), check `src/components/` for a specialized component (naming pattern `[Modifier][ElementName]`, e.g. `ColorInput`, `DateInput`) — use it, never the generic wrapper with a `type` attribute.

- The sibling-import ban above applies here too when consuming a wrapper from inside `src/components/` itself.
- Name-match: ✅ `<Input value={val} onChange={handler} />` ❌ `<input value={val} onChange={handler} />`
- Semantic-match: ✅ `<ColorInput value={val} onChange={handler} />` ❌ `<Input type="color" value={val} onChange={handler} />`

## Component-scoped custom properties

When a CSS value cannot use a global token from `styles/variables/`, declare it as a CSS custom property on the component's root element — the prefix identifies its source. DB-sourced values (known only at runtime, not at build time) are applied via an inline `style` prop, never as a direct inline style property, and prefixed `--rt-[component-name]-` to distinguish them from global tokens at a glance; the CSS file then consumes the custom property via `var()`. When a component needs both a runtime custom property and a standard CSS property in the same `style` prop, both go in a single object cast — never split across two props or two casts. Static component-scoped values (e.g. a computed layout value set via JavaScript, or an intermediate calculation shared between CSS rules within the same component) are prefixed `--[component-name]-` (kebab-cased, no `rt` segment) to distinguish them from both global tokens and runtime values.

- ✅ `style={{ '--rt-component-xyz-color': color, width: size } as React.CSSProperties}` (combined cast) or `style={{ '--rt-component-xyz-color': color } as React.CSSProperties}` (property alone) + CSS: `color: var(--rt-component-xyz-color)`
- ❌ `style={{ color: color }}` — raw runtime value applied directly as a style property
- ✅ `--card-flip-duration: 0.4s` (set in CSS) or `--floating-toolbar-offset: 0px` (set in JS as a style prop for a non-DB computed value) — both consumed via `var(...)` within the same component; illustrative, not tied to any specific file
- ❌ `--rt-toolbar-position: 8px` — the `--rt-` prefix signals DB-sourced; do not use it for static or JS-computed values that are not DB-derived

## Controlled inputs that drive auto-save mutations

**Controlled inputs that drive auto-save mutations use local state for the displayed value.** When a text or date input is bound to a server value and calls a mutation on change, bind `value` to a `useState` variable — not directly to the query result. Call both the local setter and the debounced updater in `onChange`. Binding `value` directly to the query result causes the input to jump mid-keystroke when TanStack Query re-fetches after invalidation. The `?? ''` initializer is correct at this boundary: HTML inputs require a string, and the empty string represents "nothing displayed" — a distinct concept from the nullable DB column representing "nothing stored."

- ✅ GOOD: `const [name, setName] = useState(widget?.name ?? ''); <Input value={name} onChange={(e) => { setName(e.target.value); updateWidget({ name: e.target.value }); }} />` — illustrative; the codebase's own extracted implementation of this exact pattern is `SyncedInput` (`src/components/SyncedInput/SyncedInput.tsx`, via `useSyncedInputValue`)
- ❌ BAD: `<Input value={widget.name ?? ''} onChange={(e) => updateWidget({ name: e.target.value })} />`

## Framework context is not a prop

Never relay a value as a prop when the receiving component can obtain it directly from a framework-managed context. This prohibition covers data-fetching results, data-fetching callbacks, and routing context (URL params via `useParams`). Props are reserved for state that genuinely belongs to a parent: cross-component coordination such as tooltip visibility, modal open/close, or selection state shared between siblings. Pass a callback down only when the parent owns the coordination state and the child reports events up. If a component has a button, that component owns the button's action — it does not receive a callback from two levels up.

- ❌ BAD: `SessionScreen` fetches session data, passes it to `PrepView`, which passes it to `StepSection`, which passes it to `StepSectionHeader`
- ✅ GOOD: `StepSectionHeader` calls `useSession(sessionId)` directly; TanStack Query serves the cached value
- ❌ BAD: `SessionScreen` passes `sessionId` and `adventureId` as props to `SessionHeader`, which then passes them to `useSession`
- ✅ GOOD: `SessionHeader` calls `useParams()` directly and passes the result to `useSession`
