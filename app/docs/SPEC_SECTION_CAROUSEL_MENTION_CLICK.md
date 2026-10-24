# Spec: Content section carousel and click-opened mention popups

Branch `feat/section-carousel-mention-click`. Sub-feature files: [SF1](SPEC_SECTION_CAROUSEL_MENTION_CLICK_SF1.md), [SF2](SPEC_SECTION_CAROUSEL_MENTION_CLICK_SF2.md), [SF3](SPEC_SECTION_CAROUSEL_MENTION_CLICK_SF3.md), [SF4](SPEC_SECTION_CAROUSEL_MENTION_CLICK_SF4.md), [SF5](SPEC_SECTION_CAROUSEL_MENTION_CLICK_SF5.md), [SF6](SPEC_SECTION_CAROUSEL_MENTION_CLICK_SF6.md).

Every layer touched is the Frontend (`app/src/`); no sub-feature is a Foundation SF: no sub-feature leaves the baseline checks unable to pass on its own.

Contract blocks in the sub-feature files (prop lists, hook and helper signatures) were checked as declarations: [spec-writer_1: ran `npx tsc --noEmit` from `app/` with them in a scratch file — no errors]; [spec-writer_2: ran `npx eslint` on the scratch file — only `local/no-unused-exports`, an artifact of the file having no importers].

## Progress tracker

- Sub-feature 1: UpDownBtns — extract the session-independent up/down chevron pair from `StepSectionHeaderMoveBtn` into a shared component
- Sub-feature 2: Section stepping and slide primitive — `useListNavigation` gains stepping and a recorded transition; new `SlideTransition` component
- Sub-feature 3: Entity-screen section carousel — "Popup Content" empty title, up/down buttons, slide in the content panel
- Sub-feature 4: Popup section carousel — up/down buttons and slide of the summary region in the mention popup
- Sub-feature 5: Click-opened popup lifecycle — popup `mode`, click-open entry point, click-outside and Escape dismissal
- Sub-feature 6: Badge click-open and selection suppression — badge opens its popup on click, no popup during a text selection

## Key Architectural Decisions

### UpDownBtns is one shared presentational component

The up/down chevron pair is a component in `src/components/UpDownBtns/` that `StepSectionHeaderMoveBtn`, the content panel and the popup render; the session-coupled logic stays in `StepSectionHeaderMoveBtn`. C1.

### useListNavigation records the transition in its handlers

`select` and the step handlers store `{ from, direction }` in state when they run, so a fallback selection (the selected section removed elsewhere) never carries a direction; `endTransition` clears it. Burger picks, creation and deletion all go through `select` and therefore slide. C2, row 1, row 7.

### SlideTransition and summarySlide take one `slide` object

`SlideTransition` receives `slide: { direction, outgoing } | null` rather than separate `direction` and `outgoing` props, because a direction without an outgoing node (or the reverse) is an impossible state. It animates only while `slide` is non-null. One level up, `EntityPopupBody`'s `summarySlide` is `{ slide: { direction, outgoing: { summary, summaryHeader, textEditorId } } | null; onEnd }`, so the same impossible state is not representable there either; `EntityPopupBody` passes `slide` straight to `SlideTransition`, and `BaseEntityPopupContent` passes `slide: null` while no transition exists, with no dummy direction.

### The outgoing slot is inert, read-only and out of flow

The outgoing slot is a frozen snapshot rendered absolutely positioned with `inert`, text editors in it `readOnly`, so it takes no input, saves nothing and does not set the host's height. C2.

### Only the popup's summary region slides

The popup's image belongs to the entity and stays; `EntityPopupBody` gains an optional `summarySlide` prop and `SessionPopupContent` and `EncounterPopupContent` stay untouched. C3.

### Popup `mode` replaces `pinned`

Each popup entry carries `mode: 'hover' | 'click' | 'pinned'`, so "pinned and click-opened together" cannot be represented. C7.

### MentionPopup owns dismissal of a click-opened popup

`useDismissClickOpened` in `MentionPopup/hooks/` listens to `click` on `document` and `keydown` Escape, active only while `mode === 'click'`; the provider cannot see the popup's inner React tree. C4, C5.

### A click on the popup's own badge is ignored by the dismissal listener; a different badge re-anchors

The listener ignores a click whose target lies inside an element carrying `data-mention-anchor` equal to the popup's `entityId`, so every badge of that entity is ignored, not only the one the popup opened from. `openPopupByClick` then decides: for an entity whose popup is `click`-open, a click at the same anchor is a no-op (the popup stays open on a second click of its badge, and keeps a position changed by a drag), and a click at a different anchor re-anchors the popup there, following the story's Decisions row "Clicking a different badge while a click-opened popup is open closes the open one and opens the clicked one's" (the effect for the same entity is the popup at the newly clicked badge). A `pinned` popup is left as it is. Each entry carries `anchor` (the position the popup was opened at; a drag changes `position`, never `anchor`), and the provider keys `MentionPopup` by `entityId` plus `anchor`, because `useDraggable` copies its initial position into state once, so a changed `position` alone would move nothing. A click that promotes a hover popup to `click` mode also needs no activation timestamp: the entity-wide ignore keeps that click from closing it at once. Row 6, and the story's re-anchor row.

### Inside clicks are recognised through the React tree

`MentionPopup`'s root `onClick` stores the native event of an inside click in a ref; the document listener ignores exactly that event. React synthetic events bubble through portals, so the section list `ContentSectionNav` portals to `document.body` counts as inside, and a list that unmounts on the click does too. The ordering (React's root listener before the `document` listener) is assumed from React's event delegation and verified by the `MentionPopup` portaled-button test. C4.

### Selection suppression reads the pointer, not the selection

A hover does not start while the primary button is held (`event.buttons`), a `mousedown` on the badge clears a pending hover timer, and a click preceded by pointer movement since `mousedown` opens nothing. `getSelection()` is not consulted. C8, row 8.

### The deleted-mention badge shares the click handler

Both badge render branches use the same click, mousedown and mouse-enter handlers; the popup shows `DeletedMentionContent`. C9.

### Navigation leaves the badge

`MentionBadge` drops `useNavigate` and `buildEntityPath`; the popup's Navigate button is the only path from a badge to the entity screen. No lint rule requires the removed imports. C10, row 3.

### The entity screen's empty title reads "Popup Content"

The string is written exactly as given. Row 9.

### Test scope

Hook, helper and handler-decided criteria get tests; slide direction, what moves and layout are hand-verified. Row 10.

## CLAUDE.md impact

None.
