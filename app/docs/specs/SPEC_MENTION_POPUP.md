# Spec: Mention Popup

## Progress Tracker

- SF1: ClickableIcon component + StepSectionHeader migration — shared icon button; migrates two ActionContainer usages in StepSectionHeader
- SF2: useDraggable hook — pointer-capture drag hook used by MentionPopup in pinned mode
- SF3: MentionPopupContent + NpcPopupContent — entity-type dispatch + NPC-specific content (image + description)
- SF4: MentionPopup component — positioned floating panel; shared by hover and pinned phases
- SF5: PinnedPopupsProvider — global pinned-popup state, route-change cleanup, portal rendering
- SF6: MentionBadge hover state — hover delay, mouse bridge, isPinned guard, portal render, pin transition

## Key Architectural Decisions

### MentionPopup lives at top-level components, not under MentionBadge

`MentionPopup` is consumed by both `MentionBadge` (hover phase) and `PinnedPopupsProvider` (pinned phase). CLAUDE.md's sub-component ownership rule requires exclusive parent ownership for placement under a parent's `components/` directory. Since two unrelated consumers exist, `MentionPopup` is a standalone module at `components/MentionPopup/`.

### createPortal is the caller's responsibility

`MentionPopup` is a plain positioned component — it does not call `createPortal` internally. `MentionBadge` wraps its hover render in `createPortal(…, document.body)`. `PinnedPopupsProvider` wraps all pinned renders in a single `createPortal(…, document.body)`. This avoids nested portals and keeps the positioning contract clear.

### Three-state popup state machine

The popup component manages `isPinned` and `isHovered` as local state (not in the provider). The three states and their transitions:

```
hover       → pinned      : user clicks Pin (onPin called → pinPopup() + hover popup unmounts)
pinned      → hover-close : user clicks Unpin while cursor IS on popup (isPinned = false; stays visible)
pinned      → closed      : user clicks Unpin while cursor NOT on popup (isPinned = false; onRemove immediately)
hover       → closed      : cursor leaves badge+popup area (mouse bridge exhausted → closePopup())
hover-close → closed      : cursor leaves popup (handleMouseLeave fires → onRemove())
```

The `hover-close` state is implemented by setting `isPinned = false` in the popup's local state; the popup's `onMouseLeave` handler then calls `onRemove` because `!isPinned`.

### PinnedPopupsProvider stores position and placement; does not own isPinned

Provider state shape per entry: `{ entityId, entityType, adventureId, position, placement, zIndex }`. The `isPinned` boolean lives inside the popup component. The provider only needs `removePopup(entityId)` — the popup calls it either immediately (on Unpin + cursor off) or via its own `onMouseLeave` (on Unpin + cursor on). `topZ` is a mutable ref (not state) on the provider — incremented on every `pinPopup` and `onBringToFront` call.

### useDraggable uses pointer capture; position is local to hook

The hook manages its own `position` state (initialized from `initialPosition`). During drag, the popup renders from hook state — no round-trip through the provider. On pointer-up, the hook calls the optional `onChange` callback, which the provider uses to persist the final position. `setPointerCapture` ensures the hook receives `pointermove` and `pointerup` even if the cursor leaves the drag-handle element.

### Route-change cleanup avoids stale-closure risk

The route-change `useEffect` calls `setPopups([])` directly (not via a `clearAllPinned` callback) to avoid adding the function to the dependency array and preventing inadvertent re-runs.

### isPinned check in MentionBadge suppresses hover entirely

When `isPinned(entityId)` returns true, `handleBadgeMouseEnter` returns immediately — no timer is started, no popup appears. The badge behaves as a plain click target while its entity is pinned.

## Sub-feature Files

- [SF1 — ClickableIcon + StepSectionHeader migration](./SPEC_MENTION_POPUP_SF1.md)
- [SF2 — useDraggable hook](./SPEC_MENTION_POPUP_SF2.md)
- [SF3 — MentionPopupContent + NpcPopupContent](./SPEC_MENTION_POPUP_SF3.md)
- [SF4 — MentionPopup component](./SPEC_MENTION_POPUP_SF4.md)
- [SF5 — PinnedPopupsProvider](./SPEC_MENTION_POPUP_SF5.md)
- [SF6 — MentionBadge hover state](./SPEC_MENTION_POPUP_SF6.md)

## CLAUDE.md Impact

None. The new structural patterns introduced (shared component at top-level, provider with portal rendering) are direct applications of existing CLAUDE.md conventions. No new conventions are introduced.
