# Spec: DeleteDialogProvider

## Progress Tracker

- SF1: Create DeleteDialogProvider — new provider, context, hook, and all barrel files under `providers/`
- SF2: Wire App.tsx — wrap app root with `<DeleteDialogProvider>`
- SF3: Refactor NpcScreen — remove local popup state, delegate to `openDeleteDialog`
- SF4: Refactor AdventureScreen — remove local popup state, delegate to `openDeleteDialog`
- SF5: Refactor StepSectionHeader — remove local popup state, delegate to `openDeleteDialog`

---

## Key Architectural Decisions

### Two independent state variables drive the dialog lifecycle

`dialog: { name: string; action: () => void } | null` controls portal presence — the portal only renders when `dialog !== null`. `popupState: 'open' | 'closed'` controls `PopUpContainer`'s animation state. These are separate because `PopUpContainer` requires 500 ms to animate out after state transitions to `'closed'`. Setting `dialog` to `null` immediately would unmount `PopUpContainer` before its closing animation completes. The `useEffect` watching `popupState` bridges the two: when `popupState` becomes `'closed'`, it waits 500 ms then clears `dialog`.

### setPopupState passed directly as PopUpContainer's setState prop

`PopUpContainer` already handles Escape-key and overlay-click close paths internally — both call the `setState` prop with `'closed'`. Passing `setPopupState` directly preserves these paths without any re-wiring. No wrapper or adapter is needed.

### providers/ is a new grouping folder

`providers/` sits at `app/src/providers/`. Per root CLAUDE.md barrel conventions, grouping folders require a `index.ts` with explicit named exports — `export *` is banned. The module directory `providers/DeleteDialogProvider/` requires its own `index.ts` (module barrel).

### Portal renders to document.body

Using `ReactDOM.createPortal` to `document.body` ensures the dialog is unaffected by any ancestor's CSS stacking context. All visual styles live in `PopUpContainer.css` and `DeleteDialog.css` — no new CSS file is added for `DeleteDialogProvider`.

### Action is typed as () => void

The `action` parameter in `openDeleteDialog` is typed `() => void`. In TypeScript, `() => Promise<void>` is assignable to `() => void` — the return value is simply discarded. Callers may pass async functions directly without wrapping.

---

## SF1: Create DeleteDialogProvider

Creates the provider component, React context, `useDeleteDialog` hook, and all barrel files.

**Files affected**

- New: `app/src/providers/DeleteDialogProvider/DeleteDialogProvider.tsx`
- New: `app/src/providers/DeleteDialogProvider/index.ts`
- New: `app/src/providers/index.ts`

**Frontend**

**Purpose:** `DeleteDialogProvider` is an app-level UI infrastructure provider. It owns the single, globally shared delete confirmation dialog and exposes `openDeleteDialog` via React context so any descendant component can trigger the dialog without owning local state or rendering `PopUpContainer` / `DeleteDialog` locally.

**Behavior:**

Context shape (declared as a named type, not inline):
```ts
type DeleteDialogContextValue = {
  openDeleteDialog: (name: string, action: () => void) => void;
};
```

Context is created with `createContext<DeleteDialogContextValue | null>(null)`.

`DeleteDialogProvider` component props: `{ children: ReactNode }`. Type as `FCProps<{ children: ReactNode }>`.

State:
- `dialog: { name: string; action: () => void } | null` — initialized to `null`
- `popupState: 'open' | 'closed'` — initialized to `'closed'`

`openDeleteDialog(name, action)` sets `dialog` to `{ name, action }` and `popupState` to `'open'`.

`onDeletionConfirm` calls `dialog?.action()` then `setPopupState('closed')`. Defined at component level.

`useEffect` dependency: `[popupState]`. When `popupState` transitions to `'closed'`, schedule `setDialog(null)` via `setTimeout` with a 500 ms delay and return a cleanup that calls `clearTimeout`. When `popupState` is `'open'`, the effect body does nothing and returns nothing.

Return value: a fragment containing:
1. `<DeleteDialogContext.Provider value={{ openDeleteDialog }}>{children}</DeleteDialogContext.Provider>`
2. When `dialog !== null`: `createPortal(<PopUpContainer state={popupState} setState={setPopupState}><DeleteDialog name={dialog.name} onDeletionConfirm={onDeletionConfirm} /></PopUpContainer>, document.body)`

`useDeleteDialog` hook: reads context with `useContext(DeleteDialogContext)`. If the value is `null`, throws `new Error('useDeleteDialog must be called within a DeleteDialogProvider')`. Otherwise returns the context value.

Imports for `DeleteDialogProvider.tsx`:
- `createContext, useContext, useState, useEffect, ReactNode` from `'react'`
- `createPortal` from `'react-dom'`
- `PopUpContainer, DeleteDialog` from `'@/components'`
- `FCProps` from `'@/types'`

**UI / Visual:** No markup or styles owned by `DeleteDialogProvider` itself. All visual output comes from `PopUpContainer` and `DeleteDialog`, rendered via the portal. No new CSS file.

**Barrel: `providers/DeleteDialogProvider/index.ts`** — module barrel, explicit named exports:
```ts
export { DeleteDialogProvider } from './DeleteDialogProvider';
export { useDeleteDialog } from './DeleteDialogProvider';
```

**Barrel: `providers/index.ts`** — grouping barrel, explicit named exports (`export *` banned):
```ts
export { DeleteDialogProvider, useDeleteDialog } from './DeleteDialogProvider';
```

---

## SF2: Wire App.tsx

Wraps the existing `App` return value with `<DeleteDialogProvider>`.

**Files affected**

- Modified: `app/src/App.tsx`

**Frontend**

**Purpose:** Makes `openDeleteDialog` available to all descendants of `App`, including all screens rendered via `<Outlet />`.

**Behavior:** `<DeleteDialogProvider>` becomes the outermost element in `App`'s return value, wrapping the existing `<ErrorBoundary>` root. No changes to any existing markup inside.

Add import: `{ DeleteDialogProvider }` from `'@/providers'`.

Return structure after change:
```tsx
<DeleteDialogProvider>
  <ErrorBoundary>
    <TanstackQueryClientProvider>
      {/* existing content unchanged */}
    </TanstackQueryClientProvider>
  </ErrorBoundary>
</DeleteDialogProvider>
```

**UI / Visual:** No visual change. The portal renders independently to `document.body`.

---

## SF3: Refactor NpcScreen

Removes local delete dialog state and delegates to `openDeleteDialog`.

**Files affected**

- Modified: `app/src/screens/npc/NpcScreen.tsx`

**Frontend**

**Purpose:** Eliminates the local `PopUpState`, `deleteDialogState`, and `PopUpContainer`/`DeleteDialog` rendering from `NpcScreen`. The screen now calls `openDeleteDialog` and lets `DeleteDialogProvider` own the dialog lifecycle.

**Behavior:**

Removals:
- `DeleteDialog` and `PopUpContainer` from the `'@/components'` import (the remaining imports — `Button`, `CustomScrollArea`, `GlassPanel`, `Input`, `TextEditor`, `UploadImgBtn` — are unchanged)
- `type PopUpState = React.ComponentProps<typeof PopUpContainer>['state']`
- `const [deleteDialogState, setDeleteDialogState] = useState<PopUpState>('closed')`
- The `<>` fragment wrapper and `</>`
- The `<PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}><DeleteDialog name={npc.name} onDeletionConfirm={() => { void handleNpcDelete(); }} /></PopUpContainer>` block

The `import { useState } from 'react'` line stays — `useState` is still used for `npcName` and `syncedNpcId`.

Additions:
- `import { useDeleteDialog } from '@/providers'`
- `const { openDeleteDialog } = useDeleteDialog()` — declared at the top of the component body, before the conditional returns

Delete NPC button `onClick`:
```tsx
onClick={() => { openDeleteDialog(npc.name, handleNpcDelete); }}
```

The root return element changes from `<>` (fragment) to `<GlassPanel className={cn('npc-screen')}>` directly — no fragment wrapper.

**UI / Visual:** No visual change.

---

## SF4: Refactor AdventureScreen

Removes local delete dialog state and delegates to `openDeleteDialog`.

**Files affected**

- Modified: `app/src/screens/adventure/AdventureScreen.tsx`

**Frontend**

**Purpose:** Same as SF3 — removes local `PopUpContainer`/`DeleteDialog` rendering from `AdventureScreen`.

**Behavior:**

Removals:
- `DeleteDialog` and `PopUpContainer` from the `'@/components'` import
- `type PopUpState = React.ComponentProps<typeof PopUpContainer>['state']` (currently placed between imports and component definition)
- `const [deleteDialogState, setDeleteDialogState] = useState<PopUpState>('closed')`
- The `<>` fragment wrapper and `</>`
- The `<PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}><DeleteDialog name={adventure.name} onDeletionConfirm={() => { void handleAdventureDelete(); }} /></PopUpContainer>` block

The `import { useState } from 'react'` line stays — `useState` is still used for `adventureName` and `syncedAdventureId`.

Additions:
- `import { useDeleteDialog } from '@/providers'`
- `const { openDeleteDialog } = useDeleteDialog()` — declared at the top of the component body, before the conditional returns

Delete Adventure button `onClick`:
```tsx
onClick={() => { openDeleteDialog(adventure.name, handleAdventureDelete); }}
```

The root return element changes from `<>` (fragment) to `<GlassPanel className={cn('adventure-screen')}>` directly.

**UI / Visual:** No visual change.

---

## SF5: Refactor StepSectionHeader

Removes local delete dialog state and delegates to `openDeleteDialog`.

**Files affected**

- Modified: `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.tsx`

**Frontend**

**Purpose:** Same as SF3 — removes local `PopUpContainer`/`DeleteDialog` rendering from `StepSectionHeader`.

**Behavior:**

Removals:
- `import { useState } from 'react'` — entirely removed; `useState` has no remaining usage after this refactor
- `DeleteDialog` and `PopUpContainer` from the `'@/components'` import (remaining imports — `Checkbox`, `ActionContainer` — are unchanged)
- `type PopUpState = React.ComponentProps<typeof PopUpContainer>['state']`
- `const [deleteDialogState, setDeleteDialogState] = useState<PopUpState>('closed')`
- The `<>` fragment wrapper and `</>`
- The `<PopUpContainer state={deleteDialogState} setState={setDeleteDialogState}><DeleteDialog name={...} onDeletionConfirm={() => { void deleteStep(step.id); }} /></PopUpContainer>` block

Additions:
- `import { useDeleteDialog } from '@/providers'`
- `const { openDeleteDialog } = useDeleteDialog()` — declared after the `useSessionSteps` and `step` derivation, before the null guard

Delete step button `onClick`:
```tsx
onClick={() => {
  const stepName =
    step.default_step_key !== null
      ? (LAZY_DM_STEPS.find((s) => s.key === step.default_step_key)?.name ?? 'Untitled Step')
      : (step.name ?? 'Untitled Step');
  openDeleteDialog(stepName, () => { void deleteStep(step.id); });
}}
```

The root return element changes from `<>` (fragment) to `<div className='step-section-header'>` directly.

**UI / Visual:** No visual change.

---

## CLAUDE.md Impact

**`app/src/CLAUDE.md`** — Update the `src/` structure diagram to include `providers/` between `hooks/` and `data-access-layer/`:

```text
├── providers/ # app-level UI infrastructure providers
│   ├── ProviderA/
│   │   ├── ProviderA.tsx
│   │   └── index.ts
│   └── index.ts
```

Add the following rule under the structure diagram (after the Screens section, before Component Library):

> **providers/** is for app-level UI infrastructure — React Context providers that wrap the app root and expose hooks. Data infrastructure (e.g., `TanstackQueryClientProvider`) stays in `data-access-layer/`. `providers/` is a grouping folder: its `index.ts` uses explicit named exports. Each provider lives in its own module directory with a required `index.ts` barrel.
