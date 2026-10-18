# Content Sections

- Sub-feature 1: Session-step lookups — one home for the lazy-DM step lookup, the step display name and the step-section element id
- Sub-feature 2: Unwrap domain-scaffold.md — reflow the long-living reference's hard-wrapped prose before it is edited
- Sub-feature 3: Reorderable nav list — extract the session steps nav into a generic `ReorderableNavList` and move `SessionStepsNav` onto it
- Sub-feature 4: Entity screen content sections — create, rename, reorder, delete and switch content sections on the base entity screen
- Sub-feature 5: Mention popup content sections — switch and reorder content sections in a base entity's mention popup, with the header showing the shown section

## Sub-feature files

- [Sub-feature 1](SPEC_CONTENT_SECTIONS_SF1.md)
- [Sub-feature 2](SPEC_CONTENT_SECTIONS_SF2.md)
- [Sub-feature 3](SPEC_CONTENT_SECTIONS_SF3.md)
- [Sub-feature 4](SPEC_CONTENT_SECTIONS_SF4.md)
- [Sub-feature 5](SPEC_CONTENT_SECTIONS_SF5.md)

Each sub-feature leaves the every-check rows of root `CLAUDE.md` — Tool Use Discipline (`type-check`, `lint`, `format-check`, from `app/`) passing on its own; none is a Foundation sub-feature. `app/src-tauri/` is not touched, so no Rust row runs.

## Key Architectural Decisions

### The backend for content sections already exists; this feature is domain labels plus frontend

`baseEntityContentSectionService` already offers `createSection(baseEntityId, type, name?)` (appends at the highest `sort_order` + 1), `updateSection`, `deleteSection` and `bulkReorderSections`, and `useBaseEntityContentSections` exposes all four [review-story_5: app/services/baseEntityContentSectionService.ts — as of d2221f96] [review-story_6: app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts — as of d2221f96]. Content sections are already in the sync registry and the mention prefetch already loads a base entity's section list [architect_12: app/src/data-access-layer/mentions/mentionPrefetchByType.ts:24-27], so no ambient system needs a new registration. Nothing under `app/db/` or `app/services/` changes.

### A new section is named after its type by its caller, never by the service

`app/services/CLAUDE.md` forbids a fallback for a nullable column ("No fallback defaults for nullable or DB-defaulted columns… Never supply `?? 'fallback'`"), and `base_entity_content_sections.name` is nullable. So `BaseEntityContentSectionPanel` passes the type's label as the `name` argument the service already accepts: `createSection(type, contentSectionTypeLabel(type))`.

### Type labels and the section display label live in `domain/`

`app/domain/CLAUDE.md` — What Belongs Here places a lookup table keyed by a domain type, and its accessor "even when it adds… a fallback default", in `domain/`. `contentSectionTypeLabel(type)` maps `'text'` → `'Text'` and `'5e-stat-block'` → `'5e Stat Block'`; `contentSectionLabel(name, type)` returns `name` unless it is `null` or `''`, else the type label. The nav list and the delete dialog use `contentSectionLabel`; the menu-bar name input shows the raw name with the type label as its placeholder; the popup label shows the raw name (`"[entity name] | "` when it is empty).

### Each view owns its shown section and nav state through one generic hook, `useListNavigation`

The entity screen panel and every popup choose a section independently, and nothing is persisted. Both need the same rules — show the selected section, else the top one; navigation exists only with more than one section; the nav is visible only while open and available; choosing a section closes the nav — so `src/hooks/useListNavigation.ts` owns them once. The selected id is state (user input); the shown item, availability and visibility are derived every render. A selected id that is not yet in the list (a section just created) or no longer in it (deleted elsewhere, synced away) falls back to the top section until it appears.

### Creating a section waits for the refetched list, then selects the new id

`useBaseEntityContentSections`'s create mutation returns its `invalidateQueries` promise from `onSuccess`. `mutateAsync` awaits the mutation's own `onSuccess` before resolving [architect_7: node_modules/@tanstack/query-core@5.104.0/src/mutation.ts:357] [architect_8: node_modules/@tanstack/query-core@5.104.0/src/mutationObserver.ts:214-219], and `invalidateQueries` resolves once the matching active queries have refetched, swallowing refetch failures [architect_9: node_modules/@tanstack/query-core@5.104.0/src/queryClient.ts:469-530]. So when `createSection` resolves, the cached list already holds the new row and selecting its id shows it immediately, instead of flashing the top section first.

### Deleting the shown section selects its neighbour first

The panel computes the next id with `getIdAfterRemoval` — the id directly below the deleted one, else the one directly above, else `null` — selects it, and only then calls `deleteSection`. The deleted row stays in the cache until the list refetches, but it is no longer the shown one.

### One generic `ReorderableNavList` serves session steps and content sections

The burger nav must look like the session screen's steps nav. Extracting `SessionStepsNav`/`SortableStepItem` into `src/components/ReorderableNavList/` gives one drag-and-reorder implementation and one stylesheet; session steps move onto it in a refactor sub-feature with unchanged behavior. "Sortable" is avoided in the name because `SortableList` and `useSortable` in this codebase mean column sorting. The current section's nav item gets `color: var(--color-fg)`.

### `ContentSectionNav` and `ContentSectionNavToggle` hold what the screen and the popup render identically

Both views map sections to nav items with `contentSectionLabel`, reorder through `bulkReorder`, and show the same burger. `ContentSectionNav` reads the sections and `bulkReorder` itself through `useBaseEntityContentSections` (`.claude/rules/src-components.md` — Framework context is not a prop) and receives only the selection state and the optional new-item button from its parent. `ContentSectionNavToggle` is the burger (`MenuIcon`) with its labels.

### The open nav replaces the panel body inline, never through a portal

In both views the open nav takes the body's place and the image/text disappear until a section is chosen or the burger is clicked again. In the popup this is required: an unpinned `MentionPopup` removes itself on `onMouseLeave` [architect_3: app/src/components/MentionPopup/MentionPopup.tsx:86-91], and `AnchoredPopup` portals to `document.body` [architect_4: app/src/components/AnchoredPopup/AnchoredPopup.tsx:72-87]; an inline nav keeps the pointer inside the popup's own DOM. Taking the body's slot also keeps the popup's height from growing, which matters because its viewport clamp re-runs only on position or placement changes [architect_5: app/src/components/MentionPopup/MentionPopup.tsx:64-74]. dnd-kit measures rects with `getBoundingClientRect` and stops collecting scrollable ancestors at `position: fixed` [architect_10: node_modules/@dnd-kit/core@6.3.1/dist/core.esm.js:602-721], so sorting inside the fixed popup needs no special handling. Dragging the pointer out of an unpinned popup mid-drag still removes the popup and drops nothing — accepted, no data changes.

### The popup header reads its shell behavior from `MentionPopupHeaderContext`; the base-entity content renders the header

The header's label and burger depend on the shown section, which only `BaseEntityPopupContent` knows. Lifting the selection into the generic `MentionPopup` shell would put base-entity state into the shell every mention type shares (the shared Best Practices rule beginning "Separation of concerns wins over DRY"), so the base-entity content renders the header. The shell's header behavior — `name`, `isPinned`, the drag handlers, `onPin`, `onRemove`, `onNavigate` — reaches it through a context `MentionPopup` provides, because relaying those callbacks through `MentionPopupContent` and `BaseEntityPopupContent` would break "it does not receive a callback from two levels up", and a `renderHeader` render prop would break "No IIFE or inline sub-components in JSX" (both `.claude/rules/src-components.md`). `MentionPopupHeader` takes only the `leading` and `titleSuffix` slots as props. It renders for sessions and encounters from `MentionPopupContent`, for base entities from `BaseEntityPopupContent` (also while loading), and in the `ErrorBoundary` fallback, so a pinned popup can always be closed.

### `PanelMenuBar` gains a `leading` slot outside the title's props

The "+"/burger on the screen and the burger in the popup sit left of the title. They render in a `leading` container before the title `div`, so they never receive `titleProps` — on a pinned popup those carry the drag handlers. When the popup header has a `leading` element, its ⠿ glyph is omitted; the title keeps the drag handlers.

### `MenuOptionRow`'s icon becomes optional

The type picker follows `RowActionsMenu` (`AnchoredPopup` + `PopupSurface` + `<ul>` of `MenuOptionRow`) but its options have no icon, so `MenuOptionRow`'s `Icon` prop becomes optional and the icon box renders only when one is passed. Its three current consumers all pass one.

### Every section type renders `TextEditor`

Type-specific bodies are out of scope; no per-type body dispatch is built, because the first non-text body's data shape is unknown (`content` is a nullable `TEXT` column holding editor state).

## CLAUDE.md impact

- No rule states where a React context scoped to a single component module lives or what shape it takes: `.claude/rules/src-providers.md` describes `src/providers/` as "app-level UI infrastructure — React Context providers that wrap the app root", and before the content-sections feature the only contexts were `app/src/providers/PinnedPopupsContext/PinnedPopupsContext.ts` and `app/src/providers/DeleteDialogProvider/DeleteDialogContext.ts`. The content-sections feature adds `app/src/components/MentionPopup/MentionPopupHeaderContext.ts` (a value type plus a `createContext<Value | null>(null)`, provided by `MentionPopup.tsx` and read through the throwing hook `useMentionPopupHeader` in `app/src/components/MentionPopup/hooks/`), so the next component-scoped context has no convention to follow [spec-writer_1: grep -rln createContext app/src — found only app/src/providers/PinnedPopupsContext/PinnedPopupsContext.ts and app/src/providers/DeleteDialogProvider/DeleteDialogContext.ts — as of d2221f96].
- `.claude/rules/src-unit-tests.md` — Testing Policy's Required list names `helper/` files, data-access-layer root helpers and `util/` functions, but not hooks under `app/src/hooks/`, although `app/src/hooks/__tests__/useDraggable.test.ts` exists; the content-sections feature adds `app/src/hooks/useListNavigation.ts` with `app/src/hooks/__tests__/useListNavigation.test.ts` by that precedent, so whether a hook in `app/src/hooks/` must have a test is settled by no rule [spec-writer_2: app/src/hooks/__tests__ — as of d2221f96, holds only useDraggable.test.ts].
- No CLAUDE.md states a test obligation for functions under `app/domain/`, although `app/domain/entities/__tests__/` tests each accessor there (for example `entityTypeLabels.test.ts`); the content-sections feature adds `app/domain/session-steps/__tests__/` and `app/domain/base-entity-content-sections/__tests__/` by that precedent, so whether a new domain accessor must have a test is settled by no rule [spec-writer_3: app/domain/entities/__tests__ — as of d2221f96, holds baseEntitySearchHints, buildBaseEntityListPath, buildEntityPath, entityTypeLabels and entityTypes tests].

## Citation record

Citations carried forward from the story review and architecture review of this feature; a repo-state citation (`— as of <sha>`) must be checked against current HEAD before use.

- [review-story_1: app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/SessionStepsNav.tsx — as of d2221f96] — the steps nav is a dnd-kit sortable list plus a `NewItemBtn`
- [review-story_2: app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.tsx:60-74 — as of d2221f96] — the step trash icon calls `openDeleteDialog` with `oneClickConfirm: true`
- [review-story_3: app/src/screens/base-entity/components/BaseEntitySummary/BaseEntitySummary.tsx — as of d2221f96] — the current single-section panel shows "Content Section" when there is no section
- [review-story_4: app/src/components/MentionPopup/components/MentionPopupHeader/MentionPopupHeader.tsx — as of d2221f96] — the ⠿ glyph and the drag handlers apply only when pinned
- [review-story_5: app/services/baseEntityContentSectionService.ts — as of d2221f96]
- [review-story_6: app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts — as of d2221f96]
- [review-story_7: app/domain/base-entity-content-sections/contentSectionTypes.ts — as of d2221f96] — `BASE_ENTITY_CONTENT_SECTION_TYPES = ['text', '5e-stat-block']`
- [review-story_8: app/db/_migrations/1789743068849_add_base_entity_content_sections.ts — as of d2221f96] — migrated summary sections are named `'Summary'`
- [review-story_9: app/src/components/MentionPopup/MentionPopup.tsx — as of d2221f96] — the popup header is rendered by the generic shell for every mention type
- [architect_1: app/src/components/MentionPopup/MentionPopup.tsx:116-134] — header and content are siblings under the shell
- [architect_2: app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx:28] — the base-entity popup content renders nothing while loading
- [architect_3: app/src/components/MentionPopup/MentionPopup.tsx:86-91]
- [architect_4: app/src/components/AnchoredPopup/AnchoredPopup.tsx:72-87]
- [architect_5: app/src/components/MentionPopup/MentionPopup.tsx:64-74]
- [architect_6: app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts:66-70] — the create mutation's `onSuccess` voids its invalidation
- [architect_7: node_modules/@tanstack/query-core@5.104.0/src/mutation.ts:357]
- [architect_8: node_modules/@tanstack/query-core@5.104.0/src/mutationObserver.ts:214-219]
- [architect_9: node_modules/@tanstack/query-core@5.104.0/src/queryClient.ts:469-530]
- [architect_10: node_modules/@dnd-kit/core@6.3.1/dist/core.esm.js:602-721]
- [architect_11: app/src/components/TextEditor/TextEditor.tsx:134] — `TextEditor` remounts on a `textEditorId` change because TanStack Router reuses a screen component across param changes
- [architect_12: app/src/data-access-layer/mentions/mentionPrefetchByType.ts:24-27]
