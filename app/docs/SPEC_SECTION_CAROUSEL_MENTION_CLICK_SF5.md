# Sub-feature 5: Click-opened popup lifecycle

Popups get a `mode` (`'hover' | 'click' | 'pinned'`), the provider gets a click-open entry point, and `MentionPopup` dismisses a click-opened popup on a click outside it or on Escape. SF6 consumes `openPopupByClick`.

## Files affected

Modified:

- `app/src/components/MentionPopup/MentionPopup.tsx` — read in full; changes below
- `app/src/components/MentionPopup/index.ts` — explicit named type export, matching its current style: `export type { PopupPosition, PopupPlacement, PopupMode } from './MentionPopup';`
- `app/src/providers/PinnedPopupsContext/PinnedPopupsContext.ts` — `PinnedPopupsContextValue` gains `openPopupByClick: (args: ShowPopupArgs) => void`
- `app/src/providers/PinnedPopupsProvider/PinnedPopupsProvider.tsx` — read in full; changes below
- `app/src/providers/AppProviders/AppProviders.tsx` — import `PinnedPopupsProvider` from `'../PinnedPopupsProvider'` (the module gains an `index.ts`)

New:

- `app/src/providers/PinnedPopupsProvider/index.ts` — `export { PinnedPopupsProvider } from './PinnedPopupsProvider';` (the module now holds more than its source file, `app/src/CLAUDE.md` — Barrel Files; explicit named export)
- `app/src/providers/PinnedPopupsProvider/popupEntry.ts` — `PopupEntry` type (moved out of the provider; two consumers: the provider and `requestPopup`), with `pinned: boolean` replaced by `mode: PopupMode` and a new field `anchor: PopupPosition` (the position the entry was opened at; new entries set it to the args' `position`; `updatePopupPosition`, the drag, changes `position` and never `anchor`)
- `app/src/providers/PinnedPopupsProvider/helper/requestPopup.ts`
- `app/src/providers/PinnedPopupsProvider/helper/__tests__/requestPopup.test.ts`
- `app/src/components/MentionPopup/hooks/useDismissClickOpened.ts`
- `app/src/components/MentionPopup/hooks/__tests__/useDismissClickOpened.test.ts`
- `app/src/components/MentionPopup/__tests__/MentionPopup.test.tsx`

Violation scan of the Modified `.tsx` files: no inline sub-component, no void-context `return null`. `MentionPopup` is rendered only by `PinnedPopupsProvider` (`grep "<MentionPopup" app/src` — found one site), so replacing its `initialIsPinned` prop breaks no other caller.

## Layered breakdown (Frontend)

### Types and state transitions

`PopupMode` is declared and exported in `MentionPopup.tsx` next to `PopupPosition`. State per request, computed by `requestPopup(prev, args, zIndex, mode)` for `mode` `'hover'` or `'click'` (`prev` the entries, `args` a `ShowPopupArgs`; returns the next entries):

| Request | Existing entry for the entity | Result | Bridges |
| --- | --- | --- | --- |
| hover (`showPopup`) | none | add entry, `mode: 'hover'` | from args |
| hover | `hover` | replace entry (as today) | from args |
| hover | `click` or `pinned` | `prev` unchanged | kept |
| click (`openPopupByClick`) | none | add entry, `mode: 'click'` | `null` |
| click | `hover` | same entry, `mode: 'click'`, position, z-index and `anchor` kept | `null` |
| click | `click`, args' `position` equals the entry's `anchor` (x and y) | `prev` unchanged | kept |
| click | `click`, different `anchor` | replace `anchor`, `position`, `placement` and `zIndex` from args, `mode: 'click'` | `null` |
| click | `pinned` | `prev` unchanged | kept |

`hidePopup(entityId)` removes only an entry whose `mode` is `'hover'`; `pinPopup` sets `mode: 'pinned'` and nulls the bridges as today; `removePopup` is unchanged. `hasPopup` is unchanged. `showPopup` and `openPopupByClick` bump `topZRef` before the call, and in `requestPopup` the new `zIndex` applies only to an added or replaced entry, so a no-op request leaves the existing `zIndex` alone. They call `setPopups((prev) => requestPopup(prev, args, topZRef.current, mode))`; `PopupEntry` construction (stripping the two bridge callbacks from `args`, `?? null`) lives in `requestPopup`. The provider passes `mode={entry.mode}` to `MentionPopup` instead of `initialIsPinned`, and keys `MentionPopup` so that a change of `anchor` remounts it and a drag does not (sketch: `${entityId}-${anchor.x}-${anchor.y}`; the exact form is the implementer's). Add a named code comment at the key stating that `useDraggable` copies `initialPosition` into state once, so the remount is what moves a re-anchored popup, and that keying on `position` would remount on every drag.

### `MentionPopup`

- **Behavior**: prop `initialIsPinned` becomes `mode: PopupMode`. The local `isPinned` state is removed; the header context's `isPinned` is `mode === 'pinned'`, and `handlePin` only calls `onPin` (the provider owns the mode). `handleMouseLeave` calls `onMouseLeaveBridge` then `onRemove` only when `mode === 'hover'`. The root `GlassPanel` gets `onClick={markInside}` from `useDismissClickOpened({ isActive: mode === 'click', anchorEntityId: entityId, onDismiss: onRemove })`. Navigate and the header's Remove button still call `onRemove`.
- **UI / Visual**: unchanged.

### `useDismissClickOpened` (`MentionPopup/hooks/`)

```ts
declare const useDismissClickOpened: (args: {
  isActive: boolean;
  anchorEntityId: string;
  onDismiss: () => void;
}) => { markInside: (event: React.MouseEvent) => void };
```

While `isActive`, an effect adds a `click` listener and a `keydown` listener to `document` and removes both on cleanup. The click listener does nothing when its event is the native event last passed to `markInside` (`event.nativeEvent` stored in a ref), nothing when `event.target` is an `Element` whose `closest('[data-mention-anchor="<anchorEntityId>"]')` is non-null, and otherwise calls `onDismiss`. The `keydown` listener calls `onDismiss` for `event.key === 'Escape'`. Add a named code comment at the stored-event ref stating that React's root listener runs before the `document` listener, so an inside click is marked before the listener sees it, and comparing the event (not a flag) cannot go stale when a click never reaches `document`. The effect's dependency array lists `isActive`, `anchorEntityId` and `onDismiss`; `onDismiss` is a fresh arrow each render in the provider, so the effect re-subscribes per render, which is accepted (no `useCallback`: no memoised consumer, `src-react-hooks.md`).

`data-mention-anchor` is set by `MentionBadge` in SF6; consumer of the attribute: this hook.

## Tests

`requestPopup.test.ts` — one behaviour per table row, each catching the named defect: hover over a `click` or `pinned` entry keeps it (a hover timer firing late would downgrade it); click over `hover` promotes without moving it and nulls the bridges (a promoted popup that still removes itself on leave); a click at a different anchor over `click` re-anchors while a second entity's entry survives (a re-click on another badge that leaves the popup at the old badge); a click at the same anchor over `click` is a no-op even after the entry's `position` was changed by a drag, and keeps its `zIndex` (a re-click that snaps a dragged popup back or raises it); a click over `pinned` is unchanged (a pinned popup downgraded or moved by a badge click); hover over `hover` replaces; fixtures hold a second entity's entry that must survive every request.

`useDismissClickOpened.test.ts` (`renderHook`, events dispatched on `document`) — inactive: a click and Escape call nothing (catches a listener that stays after leaving click mode); active: an outside click calls `onDismiss` once; a click whose event was passed to `markInside` does not; a click on an element inside `[data-mention-anchor="<anchorEntityId>"]` does not, one inside another entity's anchor does; Escape calls `onDismiss`; listeners are removed on unmount (catches a leaked listener firing for an unmounted popup).

`MentionPopup.test.tsx` — real `MentionPopup` in `click` mode with `MentionPopupContent` mocked by `vi.mock` of `./components/MentionPopupContent` to a stub with a button, a button that unmounts itself on click, and a button portaled to `document.body`, `@/data-access-layer` mocked for `useMentionEntityData`, `@tanstack/react-router` mocked for `useNavigate`: a click on each stub button does not call `onRemove` (catches the detached-target and portal misclassification); a click outside, and Escape, each call `onRemove`; leaving the pointer does not call `onRemove` in `click` mode and does in `hover` mode (catches dismissal-on-leave of a click-opened popup); Escape in `pinned` mode calls nothing (catches a listener active outside click mode). The ordering (React's root listener before the `document` listener) is pinned by the portaled-button case.

`MentionPopup`/provider level: after the key changes the new instance is at the new position — one provider-level case (real `PinnedPopupsProvider`, `MentionPopupContent` mocked as above, `openPopupByClick` called twice with different positions, asserting the popup's inline position) catching a re-anchor that changes state but leaves the popup where `useDraggable` first put it; if the provider cannot be rendered cheaply in jsdom, the case becomes the `[MANUAL-VERIFY]` below instead.

- [MANUAL-VERIFY] A drag survives a click on the same badge: the popup stays where it was dragged. A click on another badge of the same entity moves the popup to that badge.
- [MANUAL-VERIFY] In the Tauri app, a click-opened popup stays open while the pointer is elsewhere and closes on a click outside; Pin on it makes it behave as a pinned popup, and a route change clears it.
