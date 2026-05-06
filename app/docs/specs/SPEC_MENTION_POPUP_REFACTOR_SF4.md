# SF4: MentionPopup Updates

Restructure the drag handle as a `MentionPopupHeader` sub-component, add hover states, replace Pin/Unpin with Pin→X, and align the prop surface with the provider's spread pattern.

---

## Files Affected

- New: `app/src/components/MentionPopup/components/MentionPopupHeader/MentionPopupHeader.tsx`
- New: `app/src/components/MentionPopup/components/MentionPopupHeader/MentionPopupHeader.css`
- New: `app/src/components/MentionPopup/components/index.ts`
- Modified: `app/src/components/MentionPopup/MentionPopup.tsx`
- Modified: `app/src/components/MentionPopup/MentionPopup.css`

---

## Frontend

**Purpose:** Give the popup a clear drag affordance, communicate pin state through icon substitution, and clean up the props to match what the provider spreads. The header bar is extracted to `MentionPopupHeader` per the sub-component ownership rule — it is used exclusively within `MentionPopup`.

**Behavior:**

- **Unpinned state:** Shows PinIcon + ExternalLinkIcon. No explicit close button — mousing away triggers the bridge callback chain which calls `hidePopup` on the provider. `draggableProps` are not applied to the handle.
- **Pinned state:** PinIcon is replaced by XIcon. Clicking XIcon calls `onRemove`. ExternalLinkIcon remains. `draggableProps` are applied to the handle.
- **`isHovered` state is removed.** Bridge callbacks wired by the provider via `onMouseEnterBridge`/`onMouseLeaveBridge` props handle hover tracking in MentionBadge's refs entirely.
- **`handleUnpin` is removed.** `onPin` calls the provider's `pinPopup(entityId)`; no unpin action exists.
- **`handleMouseLeave`:** calls `onMouseLeaveBridge?.()` then, if `!isPinned`, calls `onRemove()`. The `isPinned` guard prevents premature removal during the brief window between pin click and provider state update.

**UI / Visual:**

`MentionPopupHeader` renders a horizontal flex row: `[⠿ icon] [name label] [action icons group]`. The name label has `flex: 1` pushing icons to the right. Hover on the handle produces background-color transitions on ⠿ and name, mirroring `SortableStepItem`. Grab cursor appears only when pinned.

---

### MentionPopupHeader.tsx

`MentionPopupHeader` is a sub-component of `MentionPopup`. Its CSS classes use the `mention-popup-` prefix since they are semantically part of the popup's identity and to avoid naming conflicts.

```tsx
// MentionPopupHeader.tsx
import React from 'react';
import { FCProps } from '@/types';
import { cn } from '@/util';
import { PinIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { ClickableIcon } from '../../ClickableIcon';
import './MentionPopupHeader.css';

type DraggableProps = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
};

type Props = {
  name: string;
  isPinned: boolean;
  draggableProps: DraggableProps;
  onPin: () => void;
  onRemove: () => void;
  onNavigate: () => void;
};

export const MentionPopupHeader: FCProps<Props> = ({
  name,
  isPinned,
  draggableProps,
  onPin,
  onRemove,
  onNavigate,
}) => (
  <div
    className={cn(
      'mention-popup-drag-handle',
      isPinned && 'mention-popup-drag-handle--pinned',
    )}
    {...(isPinned ? draggableProps : {})}
  >
    <span className='mention-popup-drag-icon'>⠿</span>
    <div className='mention-popup-drag-name'>{name}</div>
    <div className='mention-popup-menu-bar'>
      {!isPinned && (
        <ClickableIcon
          icon={<PinIcon />}
          onClick={onPin}
          label='Pin popup'
          title='Pin'
        />
      )}
      {isPinned && (
        <ClickableIcon
          icon={<XIcon />}
          onClick={onRemove}
          label='Close popup'
          title='Close'
        />
      )}
      <ClickableIcon
        icon={<ExternalLinkIcon />}
        onClick={onNavigate}
        label='Navigate to entity'
        title='Navigate'
      />
    </div>
  </div>
);
```

Note: `ClickableIcon` is imported via relative path `../../ClickableIcon` — sibling imports within `components/` use relative paths, never `@/components`.

---

### MentionPopupHeader.css

All drag-handle rules move here from `MentionPopup.css`:

```css
.mention-popup-drag-handle {
  display: flex;
  align-items: center;
  color: var(--color-primary);
}

.mention-popup-drag-handle:hover {
  color: var(--color-fg);
}

.mention-popup-drag-handle--pinned {
  cursor: grab;
}

.mention-popup-drag-handle--pinned:active {
  cursor: grabbing;
}

.mention-popup-drag-icon {
  font-size: var(--font-size-base);
  user-select: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  transition: background-color var(--transition-fast);
}

.mention-popup-drag-handle:hover .mention-popup-drag-icon {
  background-color: var(--color-primary-hover);
}

.mention-popup-drag-name {
  flex: 1;
  padding: var(--spacing-xs);
  padding-left: var(--spacing-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background-color var(--transition-fast);
}

.mention-popup-drag-handle:hover .mention-popup-drag-name {
  background-color: var(--color-bg-hover);
}

.mention-popup-menu-bar {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
}
```

---

### MentionPopup/components/index.ts

New grouping barrel — explicit named exports only. `MentionPopupHeader` has no sub-structure, so no own `index.ts` needed.

```ts
export { MentionPopupHeader } from './MentionPopupHeader/MentionPopupHeader';
```

---

### MentionPopup.tsx

Replace the inline drag-handle JSX with `<MentionPopupHeader>`. Remove `PinIcon`, `XIcon`, `ClickableIcon`, `cn` imports if no longer used elsewhere in this file (verify — `cn` is still used for the `GlassPanel` className).

```tsx
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/util';
import { buildEntityPath } from '@/domain';
import { useDraggable } from '@/hooks';
import GlassPanel from '../GlassPanel/GlassPanel';
import { MentionPopupContent } from '../MentionPopupContent';
import { MentionPopupHeader } from './components';
import { FCProps } from '@/types';
import './MentionPopup.css';

export type PopupPosition = { x: number; y: number };
export type PopupPlacement = 'above' | 'below';

type Props = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  name: string;
  position: PopupPosition;
  placement: PopupPlacement;
  zIndex?: number;
  initialIsPinned: boolean;
  onRemove: () => void;
  onPin?: () => void;
  onPositionChange?: (pos: PopupPosition) => void;
  onBringToFront?: () => void;
  onMouseEnterBridge?: () => void;
  onMouseLeaveBridge?: () => void;
};

export const MentionPopup: FCProps<Props> = ({
  entityId,
  entityType,
  adventureId,
  name,
  position,
  placement,
  zIndex,
  initialIsPinned,
  onRemove,
  onPin,
  onPositionChange,
  onBringToFront,
  onMouseEnterBridge,
  onMouseLeaveBridge,
}) => {
  const [isPinned, setIsPinned] = useState(initialIsPinned);

  const { position: dragPosition, draggableProps } = useDraggable(
    position,
    onPositionChange,
  );

  const navigate = useNavigate();

  const handleNavigate = () => {
    const path = buildEntityPath(entityType, entityId, adventureId);
    onRemove();
    void navigate({ to: path });
  };

  const handlePin = () => {
    setIsPinned(true);
    onPin?.();
  };

  const handleMouseEnter = () => {
    onMouseEnterBridge?.();
  };

  const handleMouseLeave = () => {
    onMouseLeaveBridge?.();
    if (!isPinned) {
      onRemove();
    }
  };

  return (
    <GlassPanel
      className={cn('mention-popup', `mention-popup--${placement}`)}
      style={
        {
          '--rt-x': `${dragPosition.x}px`,
          '--rt-y': `${dragPosition.y}px`,
          ...(zIndex !== undefined && { zIndex }),
        } as React.CSSProperties
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => onBringToFront?.()}
    >
      <MentionPopupHeader
        name={name}
        isPinned={isPinned}
        draggableProps={draggableProps}
        onPin={handlePin}
        onRemove={onRemove}
        onNavigate={handleNavigate}
      />

      <MentionPopupContent
        entityId={entityId}
        entityType={entityType}
        adventureId={adventureId}
      />
    </GlassPanel>
  );
};
```

**Removed imports:** `PinOffIcon`, `PinIcon`, `XIcon`, `ExternalLinkIcon`, `ClickableIcon` (all moved into `MentionPopupHeader`). `isHovered` state, `handleUnpin` removed.

---

### MentionPopup.css

Drag-handle rules removed — they live in `MentionPopupHeader.css`. Only popup-level positioning rules remain:

```css
.mention-popup {
  position: fixed;
  left: var(--rt-x);
}

.mention-popup--below {
  top: var(--rt-y);
}

.mention-popup--above {
  bottom: calc(100vh - var(--rt-y));
}
```
