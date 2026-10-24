# Sub-feature 6: Badge click-open and selection suppression

A mention badge opens its popup on click instead of navigating, and opens none while a text selection is being made. Consumes `openPopupByClick` (SF5) and sets the `data-mention-anchor` attribute that `useDismissClickOpened` (SF5) reads.

## Files affected

Modified:

- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` — read in full; changes below
- `app/docs/_product/backlog.md` — remove line 5, the entry "Fix (UX): When I highlight text in text editor and hover over a mention badge, a pop up might interrupt the highlighting ...", which this sub-feature completes (line 10, the Enter-in-typeahead item, stays)

New:

- `app/src/components/TextEditor/components/MentionBadge/helper/hasPointerMoved.ts`
- `app/src/components/TextEditor/components/MentionBadge/helper/isPrimaryButtonDown.ts`
- `app/src/components/TextEditor/components/MentionBadge/helper/__tests__/hasPointerMoved.test.ts`
- `app/src/components/TextEditor/components/MentionBadge/helper/__tests__/isPrimaryButtonDown.test.ts`
- `app/src/components/TextEditor/components/MentionBadge/__tests__/MentionBadge.test.tsx`

`MentionBadge/index.ts` (`export { MentionBadge } from './MentionBadge';`) needs no change: explicit named export, public API unchanged. Violation scan of `MentionBadge.tsx`: no inline sub-component, no void-context `return null`; after the change nothing imported is unused (`useNavigate`, `buildEntityPath` and the `@domain` import are removed; `@domain` has no other use in the file).

## Layered breakdown (Frontend)

### Helpers (`MentionBadge/helper/`)

```ts
declare const hasPointerMoved: (
  from: { x: number; y: number } | null,
  to: { x: number; y: number },
) => boolean;
declare const isPrimaryButtonDown: (buttons: number) => boolean;
```

- `hasPointerMoved` is `false` for `from === null` and otherwise `true` when the distance between the points exceeds `POINTER_MOVE_THRESHOLD_PX`, exported from the same file with value `4`; its test imports the constant.
- `isPrimaryButtonDown` reads the primary-button bit of `MouseEvent.buttons`, implemented as `buttons % 2 === 1`.

### `MentionBadge`

- **Purpose**: unchanged; the inline mention. Now the popup opens on click and never navigates.
- **Behavior**:
  - Both render branches (live and deleted) set `data-mention-anchor={entityId}` and share `onMouseDown`, `onClick`, `onMouseEnter`, `onMouseLeave`; the deleted branch gains `onMouseDown` and `onClick`.
  - A `mouseDownPositionRef` holds `{ x, y }` (`clientX`, `clientY`) from `onMouseDown`, which also clears a pending hover timer.
  - `handleBadgeMouseEnter` returns before arming the timer, prefetching or setting `isMouseOnBadgeRef` when `isPrimaryButtonDown(event.buttons)`; the existing `hasPopup` early return stays first.
  - `handleClick` clears the hover timer, reads and resets `mouseDownPositionRef`, returns when `hasPointerMoved(down, { x: event.clientX, y: event.clientY })`, and otherwise calls `openPopupByClick` with the same entity, name, `position` and `placement` as the hover path and no mouse bridges. The `position`/`placement` read from `badgeRef` is extracted to one function of the component used by `showPopupFromBadge` and `handleClick` (it reads a ref, so it stays in the file, `src-components.md` — Component Library). `hidePopup` and navigation are no longer called from the click.
  - The hover timer, mouse-leave and `hideTimerRef` logic are otherwise unchanged; `hidePopup` on leave now spares click and pinned popups through the provider (SF5).
- **UI / Visual**: no change.

## Tests

`hasPointerMoved.test.ts` — no `from` is not a move (catches a click without `mousedown` being swallowed); a distance just under and just over the threshold, in both axes (catches a wrong comparison and a one-axis check). `isPrimaryButtonDown.test.ts` — `1` and `3` true, `0`, `2`, `4` false (catches testing equality with `1`, which misses the primary button held together with another).

`MentionBadge.test.tsx` — real `PinnedPopupsProvider` and `MentionPopup`, `@tanstack/react-router` mocked (`useNavigate` spy, `useRouterState`), `@/data-access-layer` mocked for the mention hooks, `MentionPopupContent` stubbed as in SF5; `vi.useFakeTimers({ shouldAdvanceTime: true })` for the 500 ms hover; each test dispatches DOM events with `userEvent`/`fireEvent`:

- Clicking a badge shows its popup and does not call the navigate spy — catches a leftover navigation or a missing open.
- A click on a deleted-entity badge shows its popup — catches the deleted branch missing the handler.
- Hover then click keeps the popup after the pointer leaves the badge and the popup — catches the hover popup removed by leave after promotion.
- A second click on the same badge leaves the popup open — catches the toggle.
- A click on a second badge closes the first popup and shows the second's — catches a missing dismissal or a click-open that loses to the dismissal listener.
- A pinned popup stays pinned after its badge is clicked — catches downgrade.
- Hover with the primary button held opens no popup after 500 ms; entering without the button does — catches a missing guard.
- A `mousedown` on the badge during the hover delay cancels the popup — catches the timer surviving a press.
- `mousedown`, pointer movement, `click` on the badge opens none; without movement it does — catches the missing drag release guard.

- [MANUAL-VERIFY] In the web-mode browser pane: select text across a mention badge in an editor by dragging; no popup appears during the drag and none when the mouse is released over a badge, and the selection stays intact.
- [MANUAL-VERIFY] A drag that starts outside a badge and ends on it fires `click` on a common ancestor, not the badge (per the UI Events specification); confirm no popup opens.
- [MANUAL-VERIFY] In the Tauri app, a click on a badge inside the Lexical editor opens the popup at the badge, and Navigate in the popup reaches the entity screen.
