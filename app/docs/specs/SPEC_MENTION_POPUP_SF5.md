# SF5: PinnedPopupsProvider

Create the global provider that owns pinned-popup state, renders all pinned popups via a single portal, and clears them on route change. Depends on SF4 (MentionPopup). Consumed by SF6 (MentionBadge calls `pinPopup` and `isPinned`).

## Files Affected

**New:**

- `app/src/providers/PinnedPopupsProvider/PinnedPopupsContext.ts`
- `app/src/providers/PinnedPopupsProvider/PinnedPopupsProvider.tsx`
- `app/src/providers/PinnedPopupsProvider/usePinnedPopups.ts`
- `app/src/providers/PinnedPopupsProvider/index.ts`

**Modified:**

- `app/src/providers/index.ts` — add PinnedPopupsProvider, usePinnedPopups, PinPopupArgs exports
- `app/src/App.tsx` — mount PinnedPopupsProvider inside TanstackQueryClientProvider

## Frontend

### PinnedPopupsContext.ts

Defines the context type, the `PinPopupArgs` type (exported — consumed by SF6's `MentionBadge`), and the context object.

```ts
import { createContext } from 'react';
import type { PopupPosition, PopupPlacement } from '@/components';

export type PinPopupArgs = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  position: PopupPosition;
  placement: PopupPlacement;
};

export type PinnedPopupsContextValue = {
  pinPopup: (args: PinPopupArgs) => void;
  removePopup: (entityId: string) => void;
  isPinned: (entityId: string) => boolean;
  updatePopupZIndex: (entityId: string, zIndex: number) => void;
  updatePopupPosition: (entityId: string, position: PopupPosition) => void;
};

export const PinnedPopupsContext = createContext<PinnedPopupsContextValue | null>(null);
```

`clearAllPinned` is not in the context value — it is called internally via `setPopups([])` directly in the route-change effect (see provider below).

---

### PinnedPopupsProvider.tsx

**Purpose:** Holds `popups` state; constructs and provides the context value; renders all pinned popups into `document.body` via a single `createPortal`; clears all popups on route change.

**Internal type:**

```ts
type PinnedPopupEntry = PinPopupArgs & { zIndex: number };
```

This type is private to the provider file — not exported.

**State and refs:**

```ts
const [popups, setPopups] = useState<PinnedPopupEntry[]>([]);
const topZRef = useRef(1000);
```

`topZRef` starts at 1000. It is incremented before use — the first pinned popup gets zIndex 1001.

**Context functions:**

```ts
const pinPopup = (args: PinPopupArgs) => {
  topZRef.current += 1;
  setPopups((prev) => [
    ...prev.filter((p) => p.entityId !== args.entityId),
    { ...args, zIndex: topZRef.current },
  ]);
};

const removePopup = (entityId: string) => {
  setPopups((prev) => prev.filter((p) => p.entityId !== entityId));
};

const isPinned = (entityId: string) => popups.some((p) => p.entityId === entityId);

const updatePopupZIndex = (entityId: string, zIndex: number) => {
  setPopups((prev) =>
    prev.map((p) => (p.entityId === entityId ? { ...p, zIndex } : p)),
  );
};

const updatePopupPosition = (entityId: string, position: PopupPosition) => {
  setPopups((prev) =>
    prev.map((p) => (p.entityId === entityId ? { ...p, position } : p)),
  );
};
```

`pinPopup` de-duplicates by `entityId` — if the same entity is already pinned, the old entry is removed and a new one with the same args and an updated `zIndex` is appended at the end. This brings the re-pinned popup to the visual front.

**Route-change cleanup:**

```ts
const routerState = useRouterState();

useEffect(() => {
  setPopups([]);
}, [routerState.location.pathname]);
```

Call `setPopups([])` directly (not via a `clearAllPinned` callback) to avoid a stale closure in the dependency array. No `eslint-disable` comment is needed — `setPopups` is stable across renders.

**Portal render:**

```tsx
const contextValue: PinnedPopupsContextValue = {
  pinPopup,
  removePopup,
  isPinned,
  updatePopupZIndex,
  updatePopupPosition,
};

return (
  <PinnedPopupsContext.Provider value={contextValue}>
    {children}
    {createPortal(
      <>
        {popups.map((entry) => (
          <MentionPopup
            key={entry.entityId}
            entityId={entry.entityId}
            entityType={entry.entityType}
            adventureId={entry.adventureId}
            position={entry.position}
            placement={entry.placement}
            zIndex={entry.zIndex}
            initialIsPinned
            onRemove={() => removePopup(entry.entityId)}
            onPositionChange={(pos) => updatePopupPosition(entry.entityId, pos)}
            onBringToFront={() => {
              topZRef.current += 1;
              updatePopupZIndex(entry.entityId, topZRef.current);
            }}
          />
        ))}
      </>,
      document.body,
    )}
  </PinnedPopupsContext.Provider>
);
```

`initialIsPinned` is written without `={true}` (JSX boolean shorthand).

**Props:** No external props other than `children`. Zero-props exception does not apply because `children` is required — use `FCProps<{ children: ReactNode }>`.

**Imports:**

- `useState`, `useRef`, `useEffect` from `react`
- `createPortal` from `react-dom`
- `ReactNode` from `react`
- `useRouterState` from `@tanstack/react-router`
- `FCProps` from `@/types`
- `MentionPopup` from `@/components`
- `PinnedPopupsContext`, `PinPopupArgs`, `PinnedPopupsContextValue` from `./PinnedPopupsContext`
- `type { PopupPosition }` from `@/components`

---

### usePinnedPopups.ts

Context hook. Throws if used outside the provider.

```ts
import { useContext } from 'react';
import { PinnedPopupsContext } from './PinnedPopupsContext';

export const usePinnedPopups = () => {
  const ctx = useContext(PinnedPopupsContext);
  if (!ctx) throw new Error('usePinnedPopups must be used within PinnedPopupsProvider');
  return ctx;
};
```

---

### PinnedPopupsProvider/index.ts

Module directory barrel.

```ts
export { PinnedPopupsProvider } from './PinnedPopupsProvider';
export { usePinnedPopups } from './usePinnedPopups';
export type { PinPopupArgs } from './PinnedPopupsContext';
```

---

### providers/index.ts

Replace the entire file:

```ts
export { DeleteDialogProvider, useDeleteDialog } from './DeleteDialogProvider';
export { PinnedPopupsProvider, usePinnedPopups } from './PinnedPopupsProvider';
export type { PinPopupArgs } from './PinnedPopupsProvider';
```

---

### App.tsx

Add `PinnedPopupsProvider` inside `TanstackQueryClientProvider` (so pinned popups can trigger TanStack Query fetches) wrapping the existing content:

```tsx
import { DeleteDialogProvider, PinnedPopupsProvider } from '@/providers';

// existing:
<TanstackQueryClientProvider>
  <PinnedPopupsProvider>     {/* add */}
    <Backdrop />
    <LightSource intensity='bright' />
    <main className='app'>
      ...
    </main>
  </PinnedPopupsProvider>   {/* add */}
</TanstackQueryClientProvider>
```

`PinnedPopupsProvider` renders portal children independently of its JSX children — mounting it here is correct regardless of where in the tree the badge components live.
