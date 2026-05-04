# SF4: MentionPopup Component

Create the positioned floating popup panel shared by the hover phase (rendered by `MentionBadge`) and the pinned phase (rendered by `PinnedPopupsProvider`). Depends on SF1 (ClickableIcon), SF2 (useDraggable), and SF3 (MentionPopupContent).

## Files Affected

**New:**

- `app/src/components/MentionPopup/MentionPopup.tsx`
- `app/src/components/MentionPopup/MentionPopup.css`
- `app/src/components/MentionPopup/index.ts`

**Modified:**

- `app/src/components/index.ts` — add MentionPopup and type exports

## Frontend

### MentionPopup.tsx

**Purpose:** A fixed-position floating panel that displays an entity's image and summary. Manages the three-state lifecycle (`hover` → `pinned` → `hover-close` → `closed`) via local `isPinned` and `isHovered` state. Delegates all data fetching to `MentionPopupContent`. Supports drag via `useDraggable` (active only in pinned mode).

**Exported types:**

```ts
export type PopupPosition = { x: number; y: number };
export type PopupPlacement = 'above' | 'below';
```

These are consumed by SF5 (PinnedPopupsProvider) and SF6 (MentionBadge). They must be exported from this file.

**Props:** Case 3 — closed API.

```ts
type Props = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  position: PopupPosition;
  placement: PopupPlacement;
  zIndex?: number;
  initialIsPinned: boolean;
  onRemove: () => void;       // called when the popup should fully disappear
  onPin?: () => void;         // called when user clicks Pin (hover phase only)
  onPositionChange?: (pos: PopupPosition) => void; // called on drag end (pinned phase only)
  onBringToFront?: () => void; // called on mousedown (pinned phase only)
  onMouseEnterBridge?: () => void; // called on popup mouseenter (hover phase only)
  onMouseLeaveBridge?: () => void; // called on popup mouseleave (hover phase only)
};
```

**Local state and refs:**

```ts
const [isPinned, setIsPinned] = useState(initialIsPinned);
const [isHovered, setIsHovered] = useState(false);
```

**Drag integration:**

```ts
const { position: dragPosition, draggableProps } = useDraggable(position, onPositionChange);
```

`useDraggable` is always called (rules of hooks). `draggableProps` are spread on the drag handle only when `isPinned` is true.

**Navigation:**

```ts
const navigate = useNavigate();

const handleNavigate = () => {
  const entitySegment = entityType.slice(0, -1);
  const path = adventureId
    ? `/adventure/${adventureId}/${entitySegment}/${entityId}`
    : `/${entitySegment}/${entityId}`;
  onRemove();
  void navigate({ to: path });
};
```

**State machine handlers:**

```ts
const handlePin = () => {
  setIsPinned(true);
  onPin?.();
};

const handleUnpin = () => {
  setIsPinned(false);
  if (!isHovered) {
    onRemove();
  }
  // If isHovered is true, the popup stays visible (hover-close state).
  // handleMouseLeave will call onRemove on the next cursor leave.
};

const handleMouseEnter = () => {
  setIsHovered(true);
  onMouseEnterBridge?.();
};

const handleMouseLeave = () => {
  setIsHovered(false);
  onMouseLeaveBridge?.();
  if (!isPinned) {
    onRemove();
  }
};
```

Note: `handleMouseLeave` reads `isPinned` from local state. In the `hover-close` transitional state (`isPinned = false`, `isHovered = true` → cursor leaves), `!isPinned` is `true`, so `onRemove()` is called. This correctly closes the popup.

**BringToFront:** On the root element's `onMouseDown` event, call `onBringToFront?.()`. Use `onMouseDown` (not `onClick`) so it fires before any button click and captures every interaction on the popup.

**JSX structure:**

```tsx
<GlassPanel
  className={cn('mention-popup', `mention-popup--${placement}`)}
  style={{
    '--rt-x': `${dragPosition.x}px`,
    '--rt-y': `${dragPosition.y}px`,
    ...(zIndex !== undefined && { zIndex }),
  } as React.CSSProperties}
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  onMouseDown={() => onBringToFront?.()}
>
  <div
    className='mention-popup-drag-handle'
    {...(isPinned ? draggableProps : {})}
  >
    <div className='mention-popup-menu-bar'>
      {!isPinned && (
        <ClickableIcon
          icon={<PinIcon />}
          onClick={handlePin}
          label='Pin popup'
          title='Pin'
        />
      )}
      {isPinned && (
        <ClickableIcon
          icon={<PinOffIcon />}
          onClick={handleUnpin}
          label='Unpin popup'
          title='Unpin'
        />
      )}
      <ClickableIcon
        icon={<ExternalLinkIcon />}
        onClick={handleNavigate}
        label='Navigate to entity'
        title='Navigate'
      />
      <ClickableIcon
        icon={<XIcon />}
        onClick={onRemove}
        label='Close popup'
        title='Close'
      />
    </div>
  </div>

  <MentionPopupContent
    entityId={entityId}
    entityType={entityType}
    adventureId={adventureId}
  />
</GlassPanel>
```

**Imports:**

`MentionPopup.tsx` lives at `app/src/components/MentionPopup/MentionPopup.tsx`. Its sibling component directories are one level up (`../`). Importing siblings through `@/components` would create a circular dependency (`components/index.ts` → `MentionPopup` → `@/components` → `components/index.ts`). Use relative paths for all sibling-component imports:

- `useState` from `react`
- `useNavigate` from `@tanstack/react-router`
- `cn` from `@/util`
- `GlassPanel` — default import from `'../GlassPanel/GlassPanel'` (GlassPanel has no `index.ts`)
- `ClickableIcon` — named import from `'../ClickableIcon'` (resolves to `../ClickableIcon/index.ts`)
- `MentionPopupContent` — named import from `'../MentionPopupContent'` (resolves to `../MentionPopupContent/index.ts`)
- `useDraggable` from `@/hooks` (hooks is not circular)
- `{ PinIcon, PinOffIcon, ExternalLinkIcon, XIcon }` from `lucide-react`
- `React` for `React.CSSProperties`

---

### MentionPopup.css

```css
.mention-popup {
  position: fixed;
  left: var(--rt-x);
  width: 280px;
}

.mention-popup--below {
  top: var(--rt-y);
}

.mention-popup--above {
  bottom: calc(100vh - var(--rt-y));
}

.mention-popup-drag-handle {
  cursor: default;
}

.mention-popup-drag-handle:active {
  cursor: grabbing;
}

.mention-popup-menu-bar {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: flex-end;
  padding: var(--spacing-xs);
}
```

`width: 280px` accommodates the 200px NPC image width plus padding defined in `NpcPopupContent.css`. This is a fixed value — no token addition is required. If the value is ever shared across multiple popup components, add a token with user approval at that point.

Position model: `--rt-x` and `--rt-y` are set via inline `style` from `dragPosition` (the hook's internal state). On `mention-popup--below`, `--rt-y` equals the badge's `rect.bottom` (popup top aligns to badge bottom). On `mention-popup--above`, `bottom: calc(100vh - var(--rt-y))` positions the popup so its bottom edge aligns with the badge's `rect.top` — the popup grows upward from there.

An entrance animation may be added as a CSS `@keyframes` rule (scale + opacity from 0 to 1) — the implementer decides the exact values. All animation durations must reference `--transition-fast` or `--transition-very-fast`.

---

### MentionPopup/index.ts

Module directory barrel. Export the component and both types — SF5 and SF6 import `PopupPosition` and `PopupPlacement`.

```ts
export { MentionPopup } from './MentionPopup';
export type { PopupPosition, PopupPlacement } from './MentionPopup';
```

---

### components/index.ts

Add:

```ts
export { MentionPopup } from './MentionPopup';
export type { PopupPosition, PopupPlacement } from './MentionPopup';
```
