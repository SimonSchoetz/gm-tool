# Spec: Pinnable List Items

A GM can pin any item in the seven list screens. Pinned items collect in a "Pinned" section above the regular list, persist across restarts, and sync to paired devices.

## Progress tracker

- Sub-feature 1: Shared popup extraction — promote the anchored popup, its surface chrome, and the menu option row out of `TextEditor/` into `src/components/`, with no behavior change
- Sub-feature 2: Persisted pin state — `pinned_order` column across the seven entity tables, cross-table DB utility, service, domain error, and DAL mutation hook
- Sub-feature 3: Row actions menu — always-visible three-dot trigger on every list row, opening a popup with a single Pin/Unpin option
- Sub-feature 4: Pinned section — partition the list so pinned items render under a "Pinned" heading above the regular rows

No sub-feature is a Foundation SF: each leaves `tsc` and `eslint` able to pass on its own, because every consumer of a symbol introduced or relocated in a sub-feature is updated within that same sub-feature.

## Key Architectural Decisions

### Pin state is a nullable ordinal column on each entity table

`pinned_order INTEGER` (nullable) is added to `npcs`, `pcs`, `foes`, `factions`, `locations`, `items`, and `sessions`. `NULL` means unpinned; a non-null value means pinned at that position, ordered ascending.

Three properties follow from putting the value on the entity row rather than in a side table or in `table_config.layout`. Adventure scoping is inherited from the row's own `adventure_id`, so no additional scoping logic exists anywhere. `ON DELETE CASCADE` disposes of pin state with the entity, so no orphan cleanup exists in any `remove.ts`. And the column syncs with no registry change, because `SYNCED_TABLES` derives each table's synced column list from `Object.keys(<table>.zodSchema.shape)` [spec-writer_4: `app/db/_sync/registry.ts:19-37`].

An ordinal rather than a boolean is required so that user-controlled ordering of the pinned section can be added later without a migration. `session_steps.sort_order INTEGER NOT NULL` is the existing precedent for an ordinal ordering column in this schema [spec-writer_5: `app/db/session-step/schema.ts` — `sort_order` column]. The ordering UI is out of scope; the column is not.

### Pinning appends; it does not insert

Pinning sets `pinned_order` to one greater than the current maximum among pinned rows of that table within the same adventure. Unpinning sets it to `NULL`. Appending keeps every pin and unpin a single-row write: no sibling rows are renumbered, so two devices pinning different items concurrently produce no multi-row conflict for the sync layer to resolve. Gaps left by unpinning are harmless, because only relative order is read.

### Pin mutation is a cross-table utility, not seven per-domain operations

Setting the ordinal is column-identical across all seven tables, so it lives in one flat file at the db root rather than in seven `db/<domain>/` directories. `app/db/CLAUDE.md` — Cross-table utilities sanctions this placement: functions operating across multiple tables live as flat files at the db root. `db/mention-search.ts` is the existing instance of the same shape, including the table-name interpolation it requires and the service-layer validation that guards it [spec-writer_6: `app/db/mention-search.ts:9-27`; `app/services/mentionSearchService.ts:3` imports `isEntityType`].

### The pin mutation invalidates by single-element query key prefix

Query key factories are internal to their DAL module and are never exported from a module barrel, so a cross-table mutation hook cannot import them. It invalidates `{ queryKey: [entityType] }` instead. This is safe because every one of the seven list key factories produces `[<plural table name>, adventureId]`, and the plural table name is exactly the `EntityType` value [spec-writer_7: `grep list: app/src/data-access-layer/{npcs,pcs,foes,factions,locations,items,sessions}/*Keys.ts` — all seven return `['<plural>', adventureId]`]. Detail keys are singular (`['npc', npcId]`) and are deliberately not invalidated: pin state is not displayed on detail screens.

### Duplication must exclude the ordinal

`db/<domain>/duplicate.ts` destructures out only the columns that must differ and spreads every remaining column into `copiedColumns` [spec-writer_8: `app/db/npc/duplicate.ts:20-27`]. Without an explicit exclusion, duplicating a pinned entity produces a second pinned entity carrying an identical ordinal, which makes the pinned section's order ambiguous. `pinned_order` is therefore added to the excluded destructure in all seven files, so duplicates always start unpinned.

### The three-dot trigger is a sibling of the row's click target, not a child

`ActionContainer` renders a `<button>` [spec-writer_9: `app/src/components/ActionContainer/ActionContainer.tsx` — returns `<button>`], and `ClickableIcon` renders an `ActionContainer` [spec-writer_10: `app/src/components/ClickableIcon/ClickableIcon.tsx:19`]. A trigger placed inside the row's existing `ActionContainer` would be a button nested in a button, which is invalid HTML that the parser restructures. The trigger is therefore rendered as a sibling of `ActionContainer` inside the row's `GlassPanel`, and the panel becomes a flex row so the trigger sits at the far right outside the configurable column grid.

### The popup extraction is three components, because CSS ownership follows what a component renders

`app/src/CLAUDE.md` — Styles requires a component's `.css` to cover only elements it renders directly, re-namespaced to that component's own block name. The classes in `TextEditorPopupStyles.css` are applied by three different kinds of element owned by different modules: `EditorPopup` renders only the positioned portal wrapper, the plugins render the surface chrome, and the option lists render the rows. A single promotion would leave CSS in a module that does not render the elements it styles, so the extraction is `AnchoredPopup` (positioning), `PopupSurface` (chrome), and `MenuOptionRow` (one option row).

### MenuOptionRow is a promotion of TableHandleMenuItem, not a new component

`TableHandleMenuItem` already implements the shared row: an `ActionContainer` wrapping a `GlassPanel` icon container and a label, with the `TEP--li` and `TEP--li-icon-container` classes and an `isActive` state [spec-writer_11: `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/components/TableHandleMenuItem/TableHandleMenuItem.tsx`]. It is relocated and renamed rather than reimplemented, gaining one prop (`isSelected`) so it can also serve the slash-command list's keyboard-highlight state. It has three consumers once this spec lands: the table handle menu, the slash command option list, and the new row actions menu.

### Pinned items are hidden as a section while a search term is active

Partitioning happens only when no search term is active. `useListFilter` returns every item as `nameMatches` and an empty `fieldMatches` when the term is empty [spec-writer_12: `app/src/hooks/useListFilter/useListFilter.ts:21-23`], so the search path keeps its current behavior exactly: pinned items flow through the normal filter and rank by the existing prefix-then-substring rules alongside everything else. A search result is a direct answer to a typed query; a pinned section above it would either duplicate matches or push them below the fold.

### The pinned section is ordered by `pinned_order`, never by the active column sort

Changing the list's column sort re-sorts the regular list and leaves the pinned section untouched. A manually curated shortcut list that reshuffles when the user sorts by date is not a shortcut. This also exercises the ordinal from the first release rather than leaving it unread until a reordering UI exists.

### "Pin" already has an unrelated meaning in this codebase

`PinnedPopupsProvider`, `usePinnedPopups`, and the control in `MentionPopupHeader` govern holding a mention popup open on screen. That system is untouched by this spec and is unrelated to pinning list items. The user-facing label is still "Pin", which is correct for both, but no symbol introduced here may read as part of the popup-pinning system — which is why every new identifier in this spec uses `pinnedOrder` / `pinned-order` rather than a bare `pinned` or `pin` stem.

## Sub-feature files

- [SF1 — Shared popup extraction](./SPEC_PINNABLE_LIST_ITEMS_SF1.md)
- [SF2 — Persisted pin state](./SPEC_PINNABLE_LIST_ITEMS_SF2.md)
- [SF3 — Row actions menu](./SPEC_PINNABLE_LIST_ITEMS_SF3.md)
- [SF4 — Pinned section](./SPEC_PINNABLE_LIST_ITEMS_SF4.md)

## CLAUDE.md impact

`app/src/CLAUDE.md` cites `EditorPopup.tsx` by name in two places — the `useLayoutEffect` exception ("See `EditorPopup.tsx`'s viewport-clamping effect") and the continuous-listener rule ("✅ GOOD: `EditorPopup.tsx`'s `ResizeObserver` callback calls `setHorizontalOffset`…"). SF1 relocates that file to `app/src/components/AnchoredPopup/AnchoredPopup.tsx`, so both references name a path that no longer exists [spec-writer_13: `app/src/components/TextEditor/components/EditorPopup/EditorPopup.tsx` — current location, as of commit 7ae2a125].

`app/src/CLAUDE.md` — Styles states that raw values in component CSS must reference design tokens. SF3 introduces no new token; the trigger column width is expressed with existing spacing tokens. No impact.

`app/db/CLAUDE.md` — Duplication documents the `duplicate.ts` shape as excluding `id`, `created_at`, `updated_at`, "plus any column that must differ in the duplicate (e.g. `image_id` …)". `pinned_order` becomes a second standing instance of that category across all seven duplication-supporting domains, which the rule's single parenthetical example does not convey [spec-writer_14: `app/db/npc/duplicate.ts:20-27` — `image_id` is the only non-mandatory exclusion present, as of commit 7ae2a125].

`app/docs/_product/domain-scaffold.md` is not a CLAUDE.md file and is handled directly: SF2 lists it under `Modified:` because its Base Schema table enumerates the columns every standard domain entity carries, and `pinned_order` becomes one of them.
