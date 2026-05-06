# SF2: Provider Redesign

Expand `PinnedPopupsProvider` to manage all popups (transient and pinned) in a single state list. Replace `PinPopupArgs` with `ShowPopupArgs`. Add `showPopup`, `hidePopup`, `hasPopup` to the context API. Store bridge callbacks in a ref Map.

---

## Files Affected

- Modified: `app/src/providers/PinnedPopupsProvider/PinnedPopupsContext.ts`
- Modified: `app/src/providers/PinnedPopupsProvider/PinnedPopupsProvider.tsx`
- Modified: `app/src/providers/PinnedPopupsProvider/index.ts`
- Modified: `app/src/providers/index.ts`

---

## Frontend

**Purpose:** Make the provider the single authority for all popup state. Transient (hover) and pinned popups share the same entry list, distinguished by a `pinned: boolean` flag. Bridge callbacks are stored in a ref Map so they update MentionBadge's refs without triggering re-renders.

**Behavior:**

- `showPopup(args)` — adds or replaces an entry with `pinned: false`; stores bridge callbacks in the ref Map.
- `hidePopup(entityId)` — removes the entry only if `!entry.pinned`; deletes bridge callbacks from the ref Map. Called by MentionBadge on mouse-leave conditions.
- `pinPopup(entityId)` — marks the existing entry as `pinned: true`; deletes bridge callbacks (no longer needed for pinned popups). Called via `onPin` prop on `MentionPopup`.
- `removePopup(entityId)` — removes the entry regardless of pinned state; deletes bridge callbacks. Called via `onRemove` prop on `MentionPopup`.
- `hasPopup(entityId)` — returns `true` if any entry exists for that entityId (transient or pinned). Used by MentionBadge to prevent re-triggering hover when a popup is already visible.
- Route change cleanup: `setPopups([])` clears all entries (existing behavior, now covers transient too).
- `updatePopupZIndex` and `updatePopupPosition` — unchanged, still used for draggable pinned popups.

**UI / Visual:** No visual change in this sub-feature. The provider render loop changes to produce the same output for pinned popups; transient popup rendering is new (SF3 wires MentionBadge to trigger it).

---

### PinnedPopupsContext.ts

Replace the full file:

```ts
import { createContext } from 'react';
import type { PopupPosition, PopupPlacement } from '@/components';

export type ShowPopupArgs = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  name: string;
  position: PopupPosition;
  placement: PopupPlacement;
  onMouseEnterBridge?: () => void;
  onMouseLeaveBridge?: () => void;
};

export type PinnedPopupsContextValue = {
  showPopup: (args: ShowPopupArgs) => void;
  hidePopup: (entityId: string) => void;
  pinPopup: (entityId: string) => void;
  removePopup: (entityId: string) => void;
  hasPopup: (entityId: string) => boolean;
  updatePopupZIndex: (entityId: string, zIndex: number) => void;
  updatePopupPosition: (entityId: string, position: PopupPosition) => void;
};

export const PinnedPopupsContext =
  createContext<PinnedPopupsContextValue | null>(null);
```

`PinPopupArgs` is removed — no external consumer after this refactor.

**Cross-SF symbol lifecycle:** `ShowPopupArgs` is consumed by `MentionBadge` in SF3. `pinPopup(entityId)` is called via `onPin` prop wired in this file's provider render (below). `hasPopup` is consumed by `MentionBadge` in SF3.

---

### PinnedPopupsProvider.tsx

Replace the full file:

```tsx
import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouterState } from '@tanstack/react-router';
import { FCProps } from '@/types';
import { MentionPopup } from '@/components';
import type { PopupPosition, PopupPlacement } from '@/components';
import {
  PinnedPopupsContext,
  ShowPopupArgs,
  PinnedPopupsContextValue,
} from './PinnedPopupsContext';

type PopupEntry = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  name: string;
  position: PopupPosition;
  placement: PopupPlacement;
  zIndex: number;
  pinned: boolean;
};

type BridgeCallbacks = {
  onMouseEnterBridge?: () => void;
  onMouseLeaveBridge?: () => void;
};

type Props = { children: ReactNode };

export const PinnedPopupsProvider: FCProps<Props> = ({ children }) => {
  const [popups, setPopups] = useState<PopupEntry[]>([]);
  const topZRef = useRef(1000);
  const bridgeCallbacksRef = useRef<Map<string, BridgeCallbacks>>(new Map());

  const routerState = useRouterState();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional route-change cleanup; setState is stable and no external subscription is needed
    setPopups([]);
    bridgeCallbacksRef.current.clear();
  }, [routerState.location.pathname]);

  const showPopup = (args: ShowPopupArgs) => {
    const { onMouseEnterBridge, onMouseLeaveBridge, ...entry } = args;
    bridgeCallbacksRef.current.set(args.entityId, {
      onMouseEnterBridge,
      onMouseLeaveBridge,
    });
    topZRef.current += 1;
    setPopups((prev) => [
      ...prev.filter((p) => p.entityId !== args.entityId),
      { ...entry, zIndex: topZRef.current, pinned: false },
    ]);
  };

  const hidePopup = (entityId: string) => {
    setPopups((prev) =>
      prev.filter((p) => p.entityId !== entityId || p.pinned),
    );
    bridgeCallbacksRef.current.delete(entityId);
  };

  const pinPopup = (entityId: string) => {
    setPopups((prev) =>
      prev.map((p) => (p.entityId === entityId ? { ...p, pinned: true } : p)),
    );
    bridgeCallbacksRef.current.delete(entityId);
  };

  const removePopup = (entityId: string) => {
    setPopups((prev) => prev.filter((p) => p.entityId !== entityId));
    bridgeCallbacksRef.current.delete(entityId);
  };

  const hasPopup = (entityId: string) =>
    popups.some((p) => p.entityId === entityId);

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

  const contextValue: PinnedPopupsContextValue = {
    showPopup,
    hidePopup,
    pinPopup,
    removePopup,
    hasPopup,
    updatePopupZIndex,
    updatePopupPosition,
  };

  return (
    <PinnedPopupsContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <>
          {popups.map((entry) => {
            const { pinned, ...entrySpread } = entry;
            const callbacks = bridgeCallbacksRef.current.get(entry.entityId);
            return (
              <MentionPopup
                key={entry.entityId}
                {...entrySpread}
                initialIsPinned={pinned}
                onRemove={() => removePopup(entry.entityId)}
                onPin={() => pinPopup(entry.entityId)}
                onPositionChange={(pos) =>
                  updatePopupPosition(entry.entityId, pos)
                }
                onBringToFront={() => {
                  topZRef.current += 1;
                  updatePopupZIndex(entry.entityId, topZRef.current);
                }}
                onMouseEnterBridge={callbacks?.onMouseEnterBridge}
                onMouseLeaveBridge={callbacks?.onMouseLeaveBridge}
              />
            );
          })}
        </>,
        document.body,
      )}
    </PinnedPopupsContext.Provider>
  );
};
```

---

### PinnedPopupsProvider/index.ts

Replace `PinPopupArgs` export with `ShowPopupArgs`:

```ts
export { PinnedPopupsProvider } from './PinnedPopupsProvider';
export { usePinnedPopups } from './usePinnedPopups';
export type { ShowPopupArgs } from './PinnedPopupsContext';
```

---

### providers/index.ts

Replace `PinPopupArgs` export with `ShowPopupArgs`:

```ts
export { AppProviders } from './AppProviders';
export { DeleteDialogProvider, useDeleteDialog } from './DeleteDialogProvider';
export { PinnedPopupsProvider, usePinnedPopups } from './PinnedPopupsProvider';
export type { ShowPopupArgs } from './PinnedPopupsProvider';
```

Note: `AppProviders` export is included here assuming SPEC_APP_PROVIDERS.md has been implemented. If not yet implemented, omit that line.
