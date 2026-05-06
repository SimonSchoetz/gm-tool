# SF3: MentionBadge Redesign

Remove all popup rendering from `MentionBadge`. Replace direct `MentionPopup` portal with calls to `showPopup`/`hidePopup` on the provider context. Keep hover timer and bridge refs.

---

## Files Affected

- Modified: `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx`

---

## Frontend

**Purpose:** MentionBadge becomes a trigger-only component. Hover timing and bridge ref management stay here; popup rendering is fully delegated to `PinnedPopupsProvider`.

**Behavior:**

- On badge mouse enter: start 1-second hover timer; if it fires and no popup exists for this entity (`!hasPopup(entityId)`), call `context.showPopup(args)` with entity data, computed position/placement, and bridge callbacks.
- On badge mouse leave: clear timer; if mouse is not on popup (`!isMouseOnPopupRef.current`), call `context.hidePopup(entityId)`.
- On badge click: call `context.hidePopup(entityId)` then navigate. (Hides transient popup; pinned popup is unaffected since `hidePopup` only removes non-pinned entries.)
- Bridge callbacks passed to `showPopup`:
  - `onMouseEnterBridge`: sets `isMouseOnPopupRef.current = true`
  - `onMouseLeaveBridge`: sets `isMouseOnPopupRef.current = false`; if `!isMouseOnBadgeRef.current`, calls `context.hidePopup(entityId)`
- `handlePin` is removed — MentionBadge no longer handles pin transitions. The pin button inside `MentionPopup` calls `onPin` which is wired by the provider to `pinPopup(entityId)`.

**UI / Visual:** No visual change — MentionBadge renders only the `<span>` badge element, unchanged.

```tsx
// MentionBadge.tsx
import { useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePinnedPopups } from '@/providers';
import { FCProps } from '@/types';
import { buildEntityPath } from '@/domain';
import type { PopupPlacement } from '@/components';
import './MentionBadge.css';

type Props = {
  entityId: string;
  entityType: string;
  displayName: string;
  color: string;
  adventureId?: string | null;
};

export const MentionBadge: FCProps<Props> = ({
  entityId,
  entityType,
  displayName,
  color,
  adventureId,
}) => {
  const navigate = useNavigate();
  const { showPopup, hidePopup, hasPopup } = usePinnedPopups();

  const badgeRef = useRef<HTMLSpanElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMouseOnBadgeRef = useRef(false);
  const isMouseOnPopupRef = useRef(false);

  const showPopupFromBadge = () => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const placement: PopupPlacement =
      rect.top > window.innerHeight / 2 ? 'above' : 'below';
    const y = placement === 'below' ? rect.bottom : rect.top;
    showPopup({
      entityId,
      entityType,
      adventureId: adventureId ?? null,
      name: displayName,
      position: { x: rect.left, y },
      placement,
      onMouseEnterBridge: () => {
        isMouseOnPopupRef.current = true;
      },
      onMouseLeaveBridge: () => {
        isMouseOnPopupRef.current = false;
        if (!isMouseOnBadgeRef.current) {
          hidePopup(entityId);
        }
      },
    });
  };

  const handleBadgeMouseEnter = () => {
    if (hasPopup(entityId)) return;
    isMouseOnBadgeRef.current = true;
    hoverTimerRef.current = setTimeout(showPopupFromBadge, 2000);
  };

  const handleBadgeMouseLeave = () => {
    isMouseOnBadgeRef.current = false;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!isMouseOnPopupRef.current) {
      hidePopup(entityId);
    }
  };

  const handleClick = () => {
    hidePopup(entityId);
    const path = buildEntityPath(entityType, entityId, adventureId ?? null);
    void navigate({ to: path });
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <span
      ref={badgeRef}
      className='mention-badge'
      style={{ '--rt-color': color } as React.CSSProperties}
      onClick={handleClick}
      onMouseEnter={handleBadgeMouseEnter}
      onMouseLeave={handleBadgeMouseLeave}
    />
  );
};
```

**Removed imports:** `createPortal`, `useState`, `PopupPosition`, `MentionPopup`, `PopupPlacement` (re-imported only if needed for type — `PopupPlacement` is still used for the placement calculation; keep it).

**Note on `hasPopup` guard:** `hasPopup(entityId)` returns true for both transient and pinned entries. This prevents a new hover popup from being shown while one is already visible for the same entity.
