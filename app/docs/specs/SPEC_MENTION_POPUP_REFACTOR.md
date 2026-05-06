# SPEC: Mention Popup Refactor

## Progress Tracker

- Sub-feature 1: [Global CSS foundations](SPEC_MENTION_POPUP_REFACTOR_SF1.md) — `.avatar-dimensions` utility class; remove fixed width from `.mention-popup`
- Sub-feature 2: [Provider redesign](SPEC_MENTION_POPUP_REFACTOR_SF2.md) — `ShowPopupArgs`, context API (`showPopup`/`hidePopup`/`pinPopup`/`hasPopup`), `PopupEntry` with `pinned` flag, bridge callbacks ref Map
- Sub-feature 3: [MentionBadge redesign](SPEC_MENTION_POPUP_REFACTOR_SF3.md) — trigger-only; remove portal and direct `MentionPopup` import; call provider context
- Sub-feature 4: [MentionPopup updates](SPEC_MENTION_POPUP_REFACTOR_SF4.md) — drag handle layout, hover states, Pin→X, bridge callback props, prop cleanup
- Sub-feature 5: [EntityPopupBody](SPEC_MENTION_POPUP_REFACTOR_SF5.md) — generic image+summary sub-component in `MentionPopupContent/components/`
- Sub-feature 6: [NpcPopupContent update](SPEC_MENTION_POPUP_REFACTOR_SF6.md) — use `EntityPopupBody`, switch to `npc.summary`, apply `.avatar-dimensions`

---

## Key Architectural Decisions

**Single renderer: PinnedPopupsProvider renders all popups.**
Previously MentionBadge rendered the hover (transient) popup directly via its own portal, and PinnedPopupsProvider rendered pinned popups via its own portal. This created a double-render seam: at pin time, MentionBadge's popup closed and the provider re-rendered a new one at the same position. The provider now renders all popups — both transient and pinned — in a single portal. MentionBadge becomes a trigger-only component with no popup rendering responsibility.

**MentionPopup stays in `components/` despite having a single renderer.**
The sub-component ownership rule governs placement within the component library. Provider modules are infrastructure; they do not become the semantic home for domain UI components by virtue of being the sole renderer. `components/MentionPopup/` is the correct location regardless of consumer count.

**Bridge callbacks stored in a ref Map, not in provider state.**
MentionBadge owns the mouse bridge refs (`isMouseOnBadge`, `isMouseOnPopup`). These refs are updated via callbacks (`onMouseEnterBridge`, `onMouseLeaveBridge`) that the popup calls on mouse events. Because these callbacks close over MentionBadge's refs and must not trigger re-renders, they are stored in `useRef<Map<string, BridgeCallbacks>>(new Map())` on the provider — keyed by `entityId`. They are removed from the Map when `pinPopup` or `removePopup` is called.

**`ShowPopupArgs` replaces `PinPopupArgs` as the exported entry-point type.**
`PinPopupArgs` was the type MentionBadge passed to `pinPopup`. In the new design, MentionBadge calls `showPopup` with `ShowPopupArgs` — which includes entity data, position, and bridge callbacks. `PinPopupArgs` is removed from the public API. `pinPopup` in the context now takes only `entityId: string` (the provider already holds all entry data).

**Provider entry spread in render: destructure `pinned`, spread the rest.**
`PopupEntry` includes a `pinned: boolean` field that has no corresponding prop on `MentionPopup`. In the provider's render, destructure `pinned` and spread the remaining fields directly into `<MentionPopup>`. `MentionPopup`'s props must exactly match the spread fields (`entityId`, `entityType`, `adventureId`, `name`, `position`, `placement`, `zIndex`) plus callbacks and `initialIsPinned`.

**Generic content is a shared sub-component, not a changed interface on MentionPopupContent.**
`MentionPopupContent` keeps its current external props (`entityId`, `entityType`, `adventureId`) and continues routing by `entityType`. The generic interface materialises as `EntityPopupBody` — a new sub-component in `MentionPopupContent/components/` that renders `{ summary: string | null; imageId: string | null }`. Name is excluded from `EntityPopupBody` because it lives in the drag handle.

**Pin→X: PinOffIcon and handleUnpin are removed entirely.**
Unpinned popups are dismissed by mousing away — no explicit close button. When pinned, PinIcon is replaced by XIcon which calls `onRemove`. The separate XIcon close button is removed. `isHovered` state and `handleUnpin` are deleted from `MentionPopup`.

**Drag handle cursor is conditional on pinned state.**
`cursor: grab` is applied only via a `mention-popup-drag-handle--pinned` modifier class. This prevents the grab cursor from appearing on a non-draggable handle.

**`ImageById` is never called with `null` from EntityPopupBody.**
`useImage(null)` with `enabled: false` in TanStack Query v5 leaves `isPending: true`, causing `ImageById` to render an infinite loading div. `EntityPopupBody` guards against this by conditionally rendering `<ImageById>` only when `imageId !== null`.

**`.avatar-dimensions` is a raw-pixel global utility class — documented exception.**
200px has no design token. A comment is required at the class definition in `global.css`. This is the only permitted raw pixel value outside of a token.

---

## CLAUDE.md Impact

**File: `app/src/CLAUDE.md` — update sub-component ownership example.**

The current example reads:
> ✅ `components/MentionPopup/` — rendered by both `MentionBadge` and `PinnedPopupsProvider`; belongs at the top level of `components/`, not inside either consumer's `components/` subdirectory
> ❌ `MentionBadge/components/MentionPopup/` when `PinnedPopupsProvider` also renders `MentionPopup`

After this refactor, `MentionBadge` no longer renders `MentionPopup`. The example is stale. Replace both lines with:

> ✅ `components/MentionPopup/` — domain UI components belong in `components/` regardless of consumer count; the sub-component ownership rule applies within the component library only, not to provider modules
> ❌ `providers/PinnedPopupsProvider/components/MentionPopup/` — provider modules are infrastructure; they do not adopt domain UI components as sub-components even when they are the sole renderer

Also add the following clarification immediately before or after the existing sub-component ownership block:

> **Sub-component ownership does not apply to provider modules.** A component rendered exclusively by a provider belongs in `components/`, not inside the provider's module directory. `providers/` is infrastructure; its `components/` subdirectory (if any) is reserved for provider-internal structural fragments, not domain UI.
