# SPEC: Session Header Consolidation

## Progress Tracker

- Sub-feature 1: Tooltip State Lift — move tooltip state and toggle logic to SessionScreen, add toggle-all Button to SessionHeader (prep view only), update PrepView to receive state via props; create the missing session/components barrel
- Sub-feature 2: StepSection IIFE Cleanup — extract the IIFE at StepSection.tsx:39–45 to a TooltipPanel sub-component; apply FCProps to StepSection; promote StepSection import in PrepView to use the new module barrel

## Key Architectural Decisions

### Tooltip state lives in SessionScreen

SessionHeader and PrepView are siblings — their shared parent is SessionScreen. State that feeds UI in two sibling components must live in the closest common ancestor. SessionScreen becomes the owner of `visibleTooltips`, `toggleTooltipForStep`, and `toggleAllTooltips`.

### TanStack Query call duplication is correct

SessionScreen calls `useSessionSteps(sessionId)` to derive `defaultStepIds` for `toggleAllTooltips`. PrepView continues to call it for its own rendering. Both use the same query key (`sessionStepKeys.list(sessionId)`) — TanStack Query serves a single cached response. Per CLAUDE.md: "Each component that needs data calls the hook itself. TanStack Query's shared cache deduplicates fetches — there is no performance penalty."

### session/components/index.ts is a required pre-existing gap

`session/components/` is a grouping folder with no barrel. Per CLAUDE.md: "Every grouping folder under `src/` requires a barrel (`index.ts`) with explicit named exports." All four component imports in `SessionScreen.tsx` currently violate this with direct paths. SF1 creates the barrel and fixes all affected imports as part of the tooltip lift work.

### Sibling imports within session/components use direct relative paths — not the barrel

`StepSection.tsx` imports `StepSectionHeader` from `'../StepSectionHeader/StepSectionHeader'`. Using the session/components barrel (`'..'`) would create a circular import — the barrel also exports `StepSection`. The same applies to `PrepView.tsx` importing `StepSection`. These direct relative paths must not be "fixed" to route through the barrel. After SF2 creates `StepSection/index.ts`, they do update to `'./StepSection'` (the module barrel, not the grouping barrel).

### IIFE in JSX extracts to a sub-component

The IIFE at `StepSection.tsx:39–45` returns JSX. Per CLAUDE.md: "Logic that returns JSX → extract to a sub-component in `components/`." StepSection gains a `components/` subdirectory, which constitutes internal sub-structure. Per barrel conventions, a module directory with sub-structure requires its own `index.ts`. SF2 creates `StepSection/index.ts`, `StepSection/components/index.ts`, and `StepSection/components/TooltipPanel.tsx`.

### TooltipPanel receives LazyDmStepKey

The parent guards with `tooltipVisible && step.default_step_key != null`. `!= null` (loose inequality) narrows `LazyDmStepKey | null | undefined` to `LazyDmStepKey` in TypeScript. TooltipPanel accepts `stepKey: LazyDmStepKey` and resolves the definition internally. `LAZY_DM_STEPS` is no longer needed in `StepSection.tsx` and its import is removed.

---

## Sub-feature 1: Tooltip State Lift

### Files Affected

Modified:
- `app/src/screens/session/SessionScreen.tsx`
- `app/src/screens/session/components/PrepView.tsx`
- `app/src/screens/session/components/SessionHeader.tsx`

New:
- `app/src/screens/session/components/index.ts`

### Layered Breakdown

#### Frontend

**`app/src/screens/session/components/index.ts`** (new)

Grouping barrel for `session/components/`. Explicit named exports only. At SF1 implementation time, `StepSection` has no module barrel (SF2 has not yet run) — reference it directly. SF2 will update the StepSection export line.

```ts
export { InGameView } from './InGameView';
export { PrepView } from './PrepView';
export { SessionHeader } from './SessionHeader';
export { StepSection } from './StepSection/StepSection';
export { StepSectionHeader } from './StepSectionHeader/StepSectionHeader';
export { StepsNavSidebar } from './StepsNavSidebar/StepsNavSidebar';
```

---

**`app/src/screens/session/SessionScreen.tsx`** (modified)

Purpose: SessionScreen becomes the owner of tooltip visibility state and the toggle logic that both SessionHeader and PrepView depend on.

Behavior:
- Add `useSessionSteps` to the `@/data-access-layer` import.
- Call `const { steps } = useSessionSteps(sessionId)` at the top of the component (no `loading` needed — PrepView handles its own loading state).
- Add tooltip state after the `view` state declaration:
  ```tsx
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- new Set() infers Set<unknown> without the explicit type arg
  const [visibleTooltips, setVisibleTooltips] = useState<Set<string>>(new Set());
  ```
- Derive `defaultStepIds` after the state declarations:
  ```tsx
  const defaultStepIds = steps
    .filter((s) => s.default_step_key !== null)
    .map((s) => s.id);
  ```
- Declare `toggleTooltipForStep` using the same functional-update pattern as the original PrepView:
  ```tsx
  const toggleTooltipForStep = (stepId: string) => {
    setVisibleTooltips((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };
  ```
- Declare `toggleAllTooltips` using the same logic as the original PrepView:
  ```tsx
  const toggleAllTooltips = () => {
    setVisibleTooltips(
      visibleTooltips.size === 0 ? new Set(defaultStepIds) : new Set(),
    );
  };
  ```
- Pass `areTooltipsVisible={visibleTooltips.size > 0}` and `onToggleAllTooltips={toggleAllTooltips}` to `SessionHeader`.
- Pass `visibleTooltips={visibleTooltips}` and `onToggleTooltip={toggleTooltipForStep}` to `PrepView`.
- Replace all four individual component imports with a single barrel import:
  ```tsx
  import { SessionHeader, PrepView, InGameView, StepsNavSidebar } from './components';
  ```
  Remove the four individual import lines that previously referenced `./components/SessionHeader`, `./components/PrepView`, `./components/InGameView`, and `./components/StepsNavSidebar/StepsNavSidebar`.

UI/Visual: Layout and rendering are unchanged. Only prop signatures and imports are updated.

---

**`app/src/screens/session/components/SessionHeader.tsx`** (modified)

Purpose: SessionHeader becomes the single toolbar for all display controls — it now renders the toggle-all tooltips Button in addition to the view switcher.

Behavior:
- Add `Button` to the `@/components` import.
- Extend `Props` with two new fields: `areTooltipsVisible: boolean` and `onToggleAllTooltips: () => void`.
- Destructure both new props in the component signature.
- Render the Button conditionally inside the `<header>` only when `view === 'prep'`:
  ```tsx
  {view === 'prep' && (
    <Button
      className='toggle-all-tooltips-btn'
      onClick={onToggleAllTooltips}
      label={areTooltipsVisible ? 'Hide all hints' : 'Show all hints'}
    />
  )}
  ```
  Place it adjacent to the existing `LabeledToggleButton` — exact position within the header `<div>` follows the existing CSS layout without modification.
- `FCProps<Props>` pattern is already applied — only the `Props` type definition changes.

UI/Visual: The toggle-all button appears in the session header when `view === 'prep'`, disappears when `view === 'ingame'`. The button label reflects `areTooltipsVisible`.

---

**`app/src/screens/session/components/PrepView.tsx`** (modified)

Purpose: PrepView becomes a controlled component — it no longer owns tooltip state, only renders based on state provided by its parent.

Behavior:
- Remove: `useState` import from `'react'`, `Button` import from `'@/components'`, `visibleTooltips` state, `toggleTooltipForStep`, `defaultStepIds`, `toggleAllTooltips`, and the `<div className='prep-view-toolbar'>...</div>` block entirely.
- Add: `FCProps` import from `'@/types'`.
- Update Props type:
  ```tsx
  type Props = {
    sessionId: string;
    visibleTooltips: Set<string>;
    onToggleTooltip: (stepId: string) => void;
  };
  ```
- Apply `FCProps<Props>` to the component:
  ```tsx
  export const PrepView: FCProps<Props> = ({ sessionId, visibleTooltips, onToggleTooltip }) => {
  ```
- Keep `useSessionSteps(sessionId)` — PrepView still needs `steps` and `loading` to render the list.
- Keep the `StepSection` import as `'./StepSection/StepSection'` — the module barrel does not yet exist at SF1 time. SF2 will update this import.
- StepSection `onToggleTooltip` prop:
  ```tsx
  onToggleTooltip={() => { onToggleTooltip(step.id); }}
  ```

Note: The `prep-view-toolbar` CSS class in `PrepView.css` becomes orphaned when the toolbar div is removed. CSS files are out of scope for this spec — the dead class is left in place.

UI/Visual: The toggle-all button is absent from the prep view content area. The `prep-view-main` div contains only `prep-view-steps` — no toolbar.

---

## Sub-feature 2: StepSection IIFE Cleanup

### Files Affected

Modified:
- `app/src/screens/session/components/StepSection/StepSection.tsx`
- `app/src/screens/session/components/index.ts`
- `app/src/screens/session/components/PrepView.tsx`

New:
- `app/src/screens/session/components/StepSection/index.ts`
- `app/src/screens/session/components/StepSection/components/index.ts`
- `app/src/screens/session/components/StepSection/components/TooltipPanel.tsx`

### Layered Breakdown

#### Frontend

**`app/src/screens/session/components/StepSection/components/TooltipPanel.tsx`** (new)

Purpose: Renders the tooltip content panel for a Lazy DM step when a matching definition exists for the given step key.

Behavior:
- Props: `stepKey: LazyDmStepKey`
- Import `LAZY_DM_STEPS` and `LazyDmStepKey` from `'@/domain'`.
- Import `FCProps` from `'@/types'`.
- Declare:
  ```tsx
  type Props = {
    stepKey: LazyDmStepKey;
  };

  export const TooltipPanel: FCProps<Props> = ({ stepKey }) => {
    const definition = LAZY_DM_STEPS.find((s) => s.key === stepKey);
    if (!definition) return null;
    return <div className='step-tooltip-panel'>{definition.tooltip}</div>;
  };
  ```
- No dedicated CSS file — the `step-tooltip-panel` class is already defined in `StepSection/StepSection.css` and applies without change.

---

**`app/src/screens/session/components/StepSection/components/index.ts`** (new)

Grouping barrel for `StepSection/components/`. Explicit named exports:

```ts
export { TooltipPanel } from './TooltipPanel';
```

---

**`app/src/screens/session/components/StepSection/index.ts`** (new)

Module barrel for the StepSection module directory. Required because StepSection now has a `components/` subdirectory (internal sub-structure). Re-exports the component:

```ts
export { StepSection } from './StepSection';
```

---

**`app/src/screens/session/components/StepSection/StepSection.tsx`** (modified)

Behavior:
1. Remove the entire `import { LAZY_DM_STEPS } from '@/domain/session-steps'` line — `LAZY_DM_STEPS` is no longer used in this file after TooltipPanel extraction. Do not add a replacement import for `LazyDmStepKey` — the type is inferred from `SessionStep` and no explicit annotation is needed.
2. Add `TooltipPanel` import from `'./components'` (the within-module grouping barrel).
3. Add `FCProps` import from `'@/types'`.
4. Apply `FCProps<Props>` to the component:
   ```tsx
   export const StepSection: FCProps<Props> = ({
     stepId,
     sessionId,
     tooltipVisible,
     onToggleTooltip,
   }) => {
   ```
5. Replace the IIFE block (lines 39–45 in the pre-change file) with:
   ```tsx
   {tooltipVisible && step.default_step_key != null && (
     <TooltipPanel stepKey={step.default_step_key} />
   )}
   ```
   `!= null` (loose inequality) narrows `LazyDmStepKey | null | undefined` to `LazyDmStepKey` — TypeScript treats this as a complete null+undefined guard, making the prop assignment type-safe.
6. Keep `import { StepSectionHeader } from '../StepSectionHeader/StepSectionHeader'` as-is — this direct relative path is required to avoid a circular import through the grouping barrel.

---

**`app/src/screens/session/components/index.ts`** (modified)

Update the StepSection export to route through the new module barrel:

- Before: `export { StepSection } from './StepSection/StepSection';`
- After: `export { StepSection } from './StepSection';`

---

**`app/src/screens/session/components/PrepView.tsx`** (modified)

Update the StepSection import to route through the new module barrel:

- Before: `import { StepSection } from './StepSection/StepSection';`
- After: `import { StepSection } from './StepSection';`

---

## CLAUDE.md Impact

None. All patterns applied in this spec — grouping barrel creation, module barrel creation, sub-component extraction, FCProps application, one-level import enforcement — are existing conventions documented in CLAUDE.md. No new structural patterns are introduced.
