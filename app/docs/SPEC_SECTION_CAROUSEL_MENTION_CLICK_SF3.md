# Sub-feature 3: Entity-screen section carousel

The entity screen's content panel gets the "Popup Content" empty title, the up/down buttons between the burger and the section name, and the slide on every section switch. Uses `UpDownBtns` (SF1), `useListNavigation` and `SlideTransition` (SF2).

## Files affected

Modified:

- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.tsx` — read in full; changes below
- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.css` — the `.base-entity-content-section-panel-content` rule moves to the new body sub-component's CSS; the `.base-entity-content-section-panel` and `-name-input` rules stay

New:

- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BaseEntityContentSectionBody/BaseEntityContentSectionBody.tsx`
- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BaseEntityContentSectionBody/BaseEntityContentSectionBody.css` — receives the moved rule, class renamed `.base-entity-content-section-body`, declarations unchanged

Violation scan of the Modified `.tsx` (inline sub-components, void-context `return null`): none found; `if (loading) return;` is a bare return in a component. Nothing is made dead: `BasicStatBlockSectionBody` and `TextEditor` stay imported, now by the new body component, and the panel drops those two imports and `CONTENT_SECTION_EDITOR_PLACEHOLDER` (moved with them).

## Layered breakdown (Frontend)

### `BaseEntityContentSectionBody` (new, `components/BaseEntityContentSectionBody/`)

Single-file module plus CSS, no `index.ts`; props `{ section: BaseEntityContentSection; isOutgoing: boolean }` (type from `@db/base-entity-content-section`, as the panel imports it).

- **Purpose**: renders one section's body, for the current section and, during a slide, for the outgoing snapshot.
- **Behavior**: owns the `div.base-entity-content-section-body` wrapper (max height and vertical scroll, so each slot scrolls on its own) and the type ternary the panel holds today: `basic-stat-block` renders `BasicStatBlockSectionBody` keyed by `section.id`; every other type renders `TextEditor` with `textEditorId` `content-section-${section.id}`, `value`, the placeholder constant. The current section passes `onChange` that calls `updateSection` — the body therefore calls `useBaseEntityContentSections(baseEntityId)` itself, with `baseEntityId` from `useParams({ strict: false })` as the panel does (`Framework context is not a prop`). When `isOutgoing` is true the `TextEditor` gets `readOnly` and no `onChange`; the stat-block body is left as is, because the outgoing slot is `inert`.
- **UI / Visual**: unchanged from today's content area.

### `BaseEntityContentSectionPanel`

- **Purpose**: unchanged; the panel for the selected section.
- **Behavior**: reads `hasPrevious`, `hasNext`, `stepPrevious`, `stepNext`, `transition`, `endTransition` from `useListNavigation(sections)` alongside the existing fields. The empty-state title string `'Content Section'` becomes `'Popup Content'`. When `isNavAvailable`, `leading` is the existing `ContentSectionNavToggle` followed by `<UpDownBtns>` (`upLabel` `Previous section`, `downLabel` `Next section`, `isUpDisabled={!hasPrevious}`, `isDownDisabled={!hasNext}`, `onUp={stepPrevious}`, `onDown={stepNext}`) inside a fragment; the `PlusIcon` branch is unchanged. The `PanelBody` content becomes `<SlideTransition slide={...} onEnd={endTransition}>` around `<BaseEntityContentSectionBody section={selected} isOutgoing={false} />`; `slide` is `null` without a transition, otherwise `{ direction: transition.direction, outgoing: <BaseEntityContentSectionBody section={transition.from} isOutgoing /> }`. Create, delete and burger picks call `select` as today and therefore slide.
- **UI / Visual**: `PanelMenuBar`'s leading slot lays its children out in a row with padding, so the burger and the pair sit side by side before the title. The `SyncedInput` title keeps its `key={selected.id}`.

Edge: deleting the selected stat-block section removes its section from the cache, and `BasicStatBlockSectionBody` renders nothing without it, so that outgoing slot is empty during the slide; this is the accepted result.

## Tests

No test file added: the criteria here are rendering (title text) and layout (slide); stepping and direction are pinned by the `useListNavigation` tests in SF2, and the button handlers are props passed through unchanged.

- [MANUAL-VERIFY] With no content section the panel title reads "Popup Content".
- [MANUAL-VERIFY] With two or more sections the pair sits between the burger and the name; up is disabled on the first section, down on the last; with one section no pair shows.
- [MANUAL-VERIFY] Down slides the current content up and out with the next entering from below; up is the reverse; a burger pick, a section creation and a section deletion each slide in the direction the section order gives.
- [MANUAL-VERIFY] During a slide the outgoing content cannot be clicked or edited and the panel height follows the incoming section.
