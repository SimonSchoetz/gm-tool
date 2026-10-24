# Sub-feature 4: Popup section carousel

The mention popup for a base entity gets the same up/down buttons between its burger and its title and the same slide, on the summary region only. Uses `UpDownBtns` (SF1), `useListNavigation` and `SlideTransition` (SF2).

## Files affected

Modified:

- `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx` — read in full; changes below
- `app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx` — read in full; changes below
- `app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.css` — `.entity-popup-body--summary` keeps its rules (now on the summary sub-component root); new `.entity-popup-body--summary-region` rule `max-width: var(--summary-max-width)` (moved from the summary rule, which keeps `max-height` and `overflow-y`)

Deleted:

- `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.css` — its only rule, `.base-entity-popup-content-hp`, moves to the new `StatBlockHp` module, so the component owns no styles of its own

New:

- `.../EntityPopupBody/components/EntityPopupSummary/EntityPopupSummary.tsx`
- `.../BaseEntityPopupContent/components/StatBlockHp/StatBlockHp.tsx`
- `.../BaseEntityPopupContent/components/StatBlockHp/StatBlockHp.css` — the moved rule, class renamed `.stat-block-hp`, declarations unchanged
- `.../BaseEntityPopupContent/helper/readPopupSummary.ts`
- `.../BaseEntityPopupContent/helper/__tests__/readPopupSummary.test.ts`

(`...` is `app/src/components/MentionPopup/components/MentionPopupContent/components`.) `SessionPopupContent.tsx` and `EncounterPopupContent.tsx` import `EntityPopupBody` and stay unchanged: the new prop is optional and without it `EntityPopupBody` renders as today. Violation scan of the Modified `.tsx` files: no inline sub-component, no void-context `return null`.

## Layered breakdown (Frontend)

### `readPopupSummary(section)` (`BaseEntityPopupContent/helper/`)

Moves the derivation out of the component, for the current and the outgoing section. Contract:

```ts
declare const readPopupSummary: (
  section: BaseEntityContentSection | null,
) => { summary: string | null; hp: { value: number | null } | null };
```

`basic-stat-block` sections give `summary = parseBasicStatBlockContent(content).textEditor` and `hp = { value: basicStatBlock.hp }`; every other section gives `summary = content` and `hp = null`; `null` section gives `{ summary: null, hp: null }`. This is the logic `BaseEntityPopupContent` holds inline today (`statBlock` and `summarySlots`).

### `StatBlockHp` (`BaseEntityPopupContent/components/StatBlockHp/`)

Props `{ hp: { value: number | null } | null }`; renders nothing for `null`, otherwise the markup of the current HP header (label `BASIC_STAT_BLOCK_HP_LABEL` from `@domain`, then the value) in `div.stat-block-hp`.

### `EntityPopupSummary` (`EntityPopupBody/components/EntityPopupSummary/`)

Props `{ summary: string; summaryHeader?: ReactNode; textEditorId: string }`; renders the `div.entity-popup-body--summary` with the header and the read-only `TextEditor` exactly as `EntityPopupBody` does today (placeholder `Nothing here yet...`). Single use inside `EntityPopupBody` for the current and the outgoing summary.

### `EntityPopupBody`

- **Purpose**: unchanged; image plus summary.
- **Behavior**: new optional prop `summarySlide?: { slide: { direction: SlideDirection; outgoing: { summary: string | null; summaryHeader: ReactNode; textEditorId: string } } | null; onEnd: () => void }` (the same `slide`-or-`null` shape as `SlideTransition`'s prop; KAD "SlideTransition and summarySlide take one `slide` object"). Without it: `summary !== null && <EntityPopupSummary .../>` as today. With it: the summary region is `<SlideTransition className='entity-popup-body--summary-region' slide={...} onEnd={...}>` around the current `EntityPopupSummary` (when `summary !== null`); `summarySlide.slide` passes straight to `SlideTransition` as `slide`, with `outgoing` replaced by `<EntityPopupSummary {...outgoing} />` when `outgoing.summary !== null` and by nothing otherwise; a transition to or from an empty section therefore shows no moving outgoing content.
- **UI / Visual**: the image frame is outside the sliding region and stays still.

### `BaseEntityPopupContent`

- **Behavior**: `useListNavigation(sections)` additionally supplies `hasPrevious`, `hasNext`, `stepPrevious`, `stepNext`, `transition`, `endTransition`. `headerSlots.leading` (set when `selected` exists) becomes, when `isNavAvailable`, the existing `ContentSectionNavToggle` followed by `<UpDownBtns>` in a fragment with the same props as SF3 (labels `Previous section` and `Next section`). The inline `statBlock`/`summarySlots` derivation is replaced by `readPopupSummary(selected)` and `<StatBlockHp hp={...}/>` as `summaryHeader`; the outgoing entry is built the same way from `transition.from`, with `textEditorId` `content-section-popup-${transition.from.id}`, and passed as `summarySlide={{ slide: transition === null ? null : { direction: transition.direction, outgoing }, onEnd: endTransition }}`. `summarySlide` is always passed (with `slide: null` while `transition` is `null`, no dummy direction), so `SlideTransition` stays mounted and the current summary is not remounted when a slide starts.
- **UI / Visual**: the title keeps `titleSuffix` the section name preceded by a pipe; the pair sits between burger and title in the header's leading slot.

## Tests

`readPopupSummary.test.ts` behaviours:

- A `basic-stat-block` section yields the editor text and the HP — catches reading the raw JSON `content` as the summary.
- A stat block with no HP yields `hp: { value: null }`, not `null` — catches dropping the HP header for a block whose HP is unset.
- A text section yields its content and `hp: null`; a `null` content yields `summary: null` — catches a stat-block header on a text section.
- A `null` section yields both `null` — catches a throw on an entity with no sections.

No component test: the popup's slide and button layout are layout-dependent, and stepping is pinned in SF2.

- [MANUAL-VERIFY] A popup for an entity with two or more sections shows the pair between its burger and its title; down and up step the summary with the slide; the image does not move; up is disabled on the first, down on the last.
- [MANUAL-VERIFY] With one or no section the popup shows no pair.
- [MANUAL-VERIFY] A Session popup and an Encounter popup render and behave as before.
