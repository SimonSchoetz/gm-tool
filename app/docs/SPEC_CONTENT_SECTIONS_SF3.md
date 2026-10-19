# Sub-feature 3: Reorderable nav list

Extract the session steps nav's sortable list into the generic `src/components/ReorderableNavList/` and render `SessionStepsNav` through it, so Sub-features 4 and 5 reuse one drag-and-reorder implementation and one look (Key Architectural Decisions — One generic `ReorderableNavList` serves session steps and content sections). Session-step behavior and styling are unchanged, apart from `--active`, a styling hook no session item uses. Commit type: `refactor`.

## Files affected

- `Modified:`
  - `app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/SessionStepsNav.tsx` — render `ReorderableNavList`
  - `app/src/screens/session/components/StepsNavSidebar/StepsNavSidebar.tsx` — import path of `SessionStepsNav`; props-pattern fix; dead class name removed
- `Deleted:`
  - `app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/index.ts` — once `components/` is gone the folder holds only `SessionStepsNav.tsx`, and a module directory has an `index.ts` only when it holds more than one main source file, its stylesheet and `__tests__/` (`app/src/CLAUDE.md` — Barrel Files)
- `New:`
  - `app/src/components/ReorderableNavList/ReorderableNavList.tsx`
  - `app/src/components/ReorderableNavList/index.ts`
- `Moved:`
  - `mv app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/components/SortableStepItem.tsx app/src/components/ReorderableNavList/components/ReorderableNavListItem/ReorderableNavListItem.tsx`, then generalize it per the substitution table below
  - `mv app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/components/SortableStepItem.css app/src/components/ReorderableNavList/components/ReorderableNavListItem/ReorderableNavListItem.css`, then rename its classes per the substitution table and add the `--active` modifier
  - `mv app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/SessionStepsNav.css app/src/components/ReorderableNavList/ReorderableNavList.css`, then rename `.steps-sidebar-nav` → `.reorderable-nav-list` and `.new-step-section-btn` → `.reorderable-nav-list-new-item-btn` in all its rules
- `Draft:` none

## Frontend

### `ReorderableNavList` — `app/src/components/ReorderableNavList/ReorderableNavList.tsx` — New

- **Purpose:** a vertical, drag-to-reorder list of clickable items with an optional new-item button — the session steps nav's list, made independent of session steps.
- **Props** (`.claude/rules/src-components.md` — Props pattern, case 3: `type Props` + `FCProps<Props>`):
  - `items: { id: string; label: string; isChecked: boolean }[]`
  - `activeId: string | null` — the item shown as current
  - `onSelect: (id: string) => void`
  - `onReorder: (orderedIds: string[]) => void`
  - `newItem: { label: string; onClick: () => void } | null` — `null` renders no new-item button.
  - `newItemRef: Ref<HTMLButtonElement>` — the new-item button's ref, a prop of its own because a ref nested in `newItem` makes `react-hooks/refs` report every read of `newItem` (`.claude/knowledge/eslint.md`). `Ref<T>` already includes `null` (`.claude/knowledge/react.md`), so a caller with no anchor passes `newItemRef={null}`.
- **Behavior:** the sensors (`PointerSensor`; `KeyboardSensor` with `sortableKeyboardCoordinates`) and `handleDragEnd` move unchanged from `SessionStepsNav.tsx`, with `steps` → `items` and `bulkReorder(reordered.map((s) => s.id))` → `onReorder(reordered.map((item) => item.id))`. Each item renders `ReorderableNavListItem` with `id`, `label`, `onSelect` and `variant={item.id === activeId ? 'active' : item.isChecked ? 'checked' : null}` — the JSX prop gives the literals their union type. When `newItem` is set, render `NewItemBtn` after the `DndContext` with `ref={newItemRef}`, `className='reorderable-nav-list-new-item-btn'`, `label={newItem.label}`, `suppressAnimation` and `onClick={newItem.onClick}`. `NewItemBtn` spreads its remaining props onto `ActionContainer`, which spreads them onto its `<button>`, so the ref reaches the button.
- **UI / Visual:** `GlassPanel` with `className='reorderable-nav-list'` and `intensity='off'` as the root, as `SessionStepsNav` renders it today; styles from the moved `ReorderableNavList.css`, imported as `import './ReorderableNavList.css'`. Imports are relative inside `src/components/`: `../GlassPanel/GlassPanel`, `../NewItemBtn/NewItemBtn`, `./components/ReorderableNavListItem/ReorderableNavListItem`; `Ref` is a type import from `react`.

### `ReorderableNavListItem` — `…/components/ReorderableNavListItem/ReorderableNavListItem.tsx` — Moved

- **Purpose:** one sortable row — a ⠿ drag handle plus a clickable label.
- **Props** (case 3, `FCProps<Props>`): `id: string`, `label: string`, `variant: 'checked' | 'active' | null`, `onSelect: (id: string) => void`.
- **Behavior and UI / Visual:** the drag behavior, markup and styling are derived from `SortableStepItem.tsx` by this substitution table; a click calls `onSelect(id)`, and `variant` adds the matching modifier class. The reference breaks the Props pattern (it destructures `({ step }: SortableStepItemProps)` without `FCProps`) and takes a query row as a prop, so those parts are not copied.

  | In `SortableStepItem.tsx` | In `ReorderableNavListItem.tsx` |
  | --- | --- |
  | `SortableStepItemProps`, `({ step }: SortableStepItemProps)` | `type Props` (above), `FCProps<Props>`, `({ id, label, variant, onSelect })` |
  | `useSortable({ id: step.id })` | `useSortable({ id })` |
  | `scrollToStep` (and its `document.getElementById` body) | removed — `onClick={() => { onSelect(id); }}` |
  | `lazyStep`, `stepName`, `LAZY_DM_STEPS` and `SessionStep` imports | removed — `label` is rendered |
  | `cn('steps-nav-item', step.checked === 1 && 'steps-nav-item--checked')` | ``cn('reorderable-nav-list-item', variant && `reorderable-nav-list-item--${variant}`)`` |
  | `steps-nav-drag-handle` | `reorderable-nav-list-item-drag-handle` |
  | `steps-nav-item-label clip-text` | `reorderable-nav-list-item-label clip-text` |
  | `import { ActionContainer } from '@/components/ActionContainer/ActionContainer'` | `import { ActionContainer } from '../../../ActionContainer/ActionContainer'` (same direct child of `src/`, so relative — `app/src/CLAUDE.md` — Barrel Files) |
  | `import './SortableStepItem.css'` | `import './ReorderableNavListItem.css'` |

### `ReorderableNavListItem.css` — Moved

Rename every class per the table: `.steps-nav-item` → `.reorderable-nav-list-item`, `.steps-nav-item--checked` → `.reorderable-nav-list-item--checked`, `.steps-nav-drag-handle` → `.reorderable-nav-list-item-drag-handle`, `.steps-nav-item-label` → `.reorderable-nav-list-item-label`, including the descendant selectors in the two `:hover` rules. Add after the `--checked` rule:

- `.reorderable-nav-list-item--active { color: var(--color-fg); }`

### `ReorderableNavList.css` — Moved

Class renames only (Files affected). The values move as they are. `border-radius: 0` and `box-shadow: none` under `.reorderable-nav-list-new-item-btn` are pre-existing raw values the project's advisory raw-CSS scan reports (`.claude/rules/src-css.md` — Design token obligation). They are carried over unchanged and listed for the user after the task, never annotated or tokenized by the implementer.

### `index.ts` — New

`export { ReorderableNavList } from './ReorderableNavList';` — an explicit named export (the module's only public export; `ReorderableNavListItem` under `components/` stays internal, `.claude/rules/src-components.md` — Component Library).

### `SessionStepsNav.tsx` — Modified

- **Purpose:** unchanged — the session sidebar's step list.
- **Behavior:** it keeps its `useParams`, `useSession` and `useSessionSteps` calls and renders only:
  - `items` — `steps.map((step) => ({ id: step.id, label: sessionStepName(step.name, step.default_step_key), isChecked: step.checked === 1 }))`
  - `activeId={null}`
  - `onSelect` — scrolls `document.getElementById(stepSectionElementId(stepId))` into view with `{ behavior: 'smooth', block: 'start' }`, the call `SortableStepItem` makes today
  - `onReorder={bulkReorder}`
  - `newItem` — `{ label: 'Add step', onClick: () => { void createStep(); } }` when `session?.active_view === 'prep'`, else `null`
  - `newItemRef={null}`
  - Its `DndContext`, `SortableContext`, sensors, `handleDragEnd`, `GlassPanel`, `NewItemBtn`, `SortableStepItem` and stylesheet imports go away.
- **Imports:** `ReorderableNavList` from `@/components/ReorderableNavList`; `sessionStepName` from `@domain` (Sub-feature 1); `stepSectionElementId` from `'../../../../helper/stepSectionElementId'` (Sub-feature 1).
- **UI / Visual:** identical to today.

### `StepsNavSidebar.tsx` — Modified

- **Purpose:** unchanged — the session screen's sidebar.
- **UI / Visual:** unchanged; the removed class had no styles.
- **Behavior:** unchanged, with these source changes:
- `import { SessionStepsNav } from './components/SessionStepsNav';` → `'./components/SessionStepsNav/SessionStepsNav'`, since the folder loses its `index.ts`.
- Fixed in the same pass (Active check on touched files):
  - Props pattern, case 2: the root renders `ScreensSidebar`, a component, and the file hardcodes `className='steps-sidebar'` on it before spreading the remaining props. `Props` becomes `{ areTooltipsVisible: boolean; onToggleAllTooltips: () => void } & Omit<React.ComponentProps<typeof ScreensSidebar>, 'className'>`, replacing `& HtmlProps<'aside'>`, and the `HtmlProps` import goes away (`.claude/rules/src-components.md` — the hardcoded-prop `Omit` rule). `SessionScreen.tsx` passes only `areTooltipsVisible` and `onToggleAllTooltips`, so no caller changes.
  - `className='toggle-all-tooltips-btn'` on the tooltips `Button` is removed. No stylesheet under `app/src/` defines that class [spec-writer_1: grep -rn "toggle-all-tooltips-btn" app/src --include='*.css' --include='*.tsx' — found only in StepsNavSidebar.tsx].

## Verification

Run the every-check rows from `app/`: `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`.

Human-tester hand-off (`pnpm run dev` only): in a session's prep view, the steps nav looks as before, a checked step is green, dragging a step by ⠿ reorders it and the order survives a reload, clicking a step scrolls to its section, and "Add step" adds one. In the in-game view the nav has no add button.
