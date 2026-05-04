# SF6: MentionBadge Hover State

Add hover delay, mouse bridge, isPinned guard, portal render, and pin transition to `MentionBadge`. This is the final sub-feature — all prior sub-features must be implemented first.

## Files Affected

**Modified:**

- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` — add hover logic, portal render, pin transition
- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.css` — no changes required (`.mention-badge` already has `cursor: pointer`)

## Frontend

### MentionBadge.tsx

**Purpose:** Extends the existing click-to-navigate badge with a 2-second hover delay that shows a `MentionPopup`. A mouse bridge keeps the popup alive while the cursor moves from badge to popup. When the entity is pinned, hover behavior is fully suppressed.

**Retained behavior:** `handleClick` navigates unchanged. The `style={{ color }}` inline style remains unchanged. The badge span structure is unchanged.

**New imports to add:**

`MentionBadge.tsx` is at `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx`. Importing `MentionPopup` through `@/components` would create a circular dependency (`components/index.ts` → `TextEditor` → `MentionBadge` → `@/components` → `components/index.ts`). Use a relative path instead — three levels up from `MentionBadge/` reaches `components/`:

```ts
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePinnedPopups } from '@/providers';
import { MentionPopup } from '../../../MentionPopup';
import type { PopupPosition, PopupPlacement } from '../../../MentionPopup';
```

`usePinnedPopups` imports from `@/providers` (no circular dependency — `providers/` is not exported via `@/components`).

**New state:**

```ts
const [popupState, setPopupState] = useState<{
  position: PopupPosition;
  placement: PopupPlacement;
} | null>(null);
```

**New refs:**

```ts
const badgeRef = useRef<HTMLSpanElement>(null);
const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const isMouseOnBadgeRef = useRef(false);
const isMouseOnPopupRef = useRef(false);
```

**Provider access:**

```ts
const { pinPopup, isPinned } = usePinnedPopups();
```

**Helper: close popup:**

```ts
const closePopup = () => setPopupState(null);
```

**Helper: show popup (called when timer fires):**

```ts
const showPopup = () => {
  if (!badgeRef.current) return;
  const rect = badgeRef.current.getBoundingClientRect();
  const placement: PopupPlacement =
    rect.top > window.innerHeight / 2 ? 'above' : 'below';
  const y = placement === 'below' ? rect.bottom : rect.top;
  setPopupState({ position: { x: rect.left, y }, placement });
};
```

`getBoundingClientRect()` is called inside a `setTimeout` callback — not during render. `useLayoutEffect` is not applicable here.

**Event handlers:**

```ts
const handleBadgeMouseEnter = () => {
  if (isPinned(entityId)) return;
  isMouseOnBadgeRef.current = true;
  hoverTimerRef.current = setTimeout(showPopup, 2000);
};

const handleBadgeMouseLeave = () => {
  isMouseOnBadgeRef.current = false;
  if (hoverTimerRef.current) {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  }
  if (!isMouseOnPopupRef.current) {
    closePopup();
  }
};

const handlePopupMouseEnter = () => {
  isMouseOnPopupRef.current = true;
};

const handlePopupMouseLeave = () => {
  isMouseOnPopupRef.current = false;
  if (!isMouseOnBadgeRef.current) {
    closePopup();
  }
};

const handlePin = () => {
  if (!popupState) return;
  pinPopup({
    entityId,
    entityType,
    adventureId: adventureId ?? null,
    position: popupState.position,
    placement: popupState.placement,
  });
  closePopup();
};
```

`handleClick` gains one addition — call `closePopup()` before navigating so the hover popup is dismissed if it happens to be visible at click time:

```ts
const handleClick = () => {
  closePopup();
  const entitySegment = entityType.slice(0, -1);
  const path = adventureId
    ? `/adventure/${adventureId}/${entitySegment}/${entityId}`
    : `/${entitySegment}/${entityId}`;
  void navigate({ to: path });
};
```

**Cleanup on unmount:**

```ts
useEffect(() => {
  return () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };
}, []);
```

**Updated JSX:**

```tsx
return (
  <>
    <span
      ref={badgeRef}
      className='mention-badge'
      style={{ color }}
      onClick={handleClick}
      onMouseEnter={handleBadgeMouseEnter}
      onMouseLeave={handleBadgeMouseLeave}
    >
      {displayName}
    </span>
    {popupState &&
      createPortal(
        <MentionPopup
          entityId={entityId}
          entityType={entityType}
          adventureId={adventureId ?? null}
          position={popupState.position}
          placement={popupState.placement}
          initialIsPinned={false}
          onRemove={closePopup}
          onPin={handlePin}
          onMouseEnterBridge={handlePopupMouseEnter}
          onMouseLeaveBridge={handlePopupMouseLeave}
        />,
        document.body,
      )}
  </>
);
```

The component now wraps its return in a fragment (`<>...</>`) to accommodate the conditional portal alongside the badge span.

**Props type:** Unchanged from the current file. No new props are added to `MentionBadge`.

---

### MentionBadge.css

No changes required. The existing `.mention-badge` rule already provides `cursor: pointer`. The hover popup is positioned via fixed CSS in `MentionPopup.css` — no badge-level CSS is needed.
