# Sub-feature 6: Add tab

Adds the right sidebar with its single Add tab: a search, a per-device type filter and the adventure's base entities, each row with image, name, type label, a quantity field and an Add button. It consumes `useAdventureBaseEntities`, `addEntityCombatants` and `isAdding` (SF3), `parseAddQuantity` (SF2) and `EncounterEntityImage` (SF5).

## Files affected

Modified:

- `app/domain/encounters/addQuantity.ts` — export `MIN_ADD_QUANTITY` and `MAX_ADD_QUANTITY` (consumed by the quantity input's `min` and `max`)
- `app/domain/encounters/shownCombatantNames.ts` — export `UNTITLED_COMBATANT_NAME` (consumed by the Add row)
- `app/domain/encounters/index.ts` — explicit exports for those three names
- `app/db/_settings/schema.ts` — add the key `encounterAddFilter: z.object({ entity_types: z.array(z.enum(BASE_ENTITY_TYPES)) })`, `BASE_ENTITY_TYPES` imported from `@domain`; no type export, `useSetting('encounterAddFilter')` infers its value type
- `app/db/_settings/__tests__/update.test.ts` — new case, below
- `app/src/screens/encounter/EncounterScreen.tsx` — a third child `div.encounter-screen-side-column` of the body, holding `EncounterSidePanel`
- `app/src/screens/encounter/EncounterScreen.css` — the body grid gains a third column `var(--encounter-screen-side-width)`; the side column is a flex column with `min-height: 0`

Deleted: none

New:

- `app/src/screens/encounter/components/EncounterSidePanel/EncounterSidePanel.tsx`, `EncounterSidePanel.css`, `index.ts`
- `.../EncounterSidePanel/components/EncounterAddTab/EncounterAddTab.tsx`, `EncounterAddTab.css`, `index.ts`, `__tests__/EncounterAddTab.test.tsx`, `helper/sortEntitiesByName.ts`, `helper/filterByEntityTypes.ts`, `helper/toggleEntityType.ts`, and `helper/__tests__/sortEntitiesByName.test.ts`, `filterByEntityTypes.test.ts`, `toggleEntityType.test.ts`
- `.../EncounterAddTab/components/EncounterAddRow/EncounterAddRow.tsx`, `EncounterAddRow.css`, `__tests__/EncounterAddRow.test.tsx`

Moved: none

Draft: none

## Layered breakdown

### Domain

`addQuantity.ts` and `shownCombatantNames.ts` export the constants named above and `index.ts` re-exports them; no logic changes, so no test changes (KAD "An unnamed entity reads \"Untitled Combatant\" in the Add tab too").

### Database

`encounterAddFilter` is stored in `_settings`, which is not a synced table, so each device keeps its own choice. `update.test.ts` new case: stores `{ entity_types: ['foes', 'npcs'] }` so the next read returns it, and rejects `{ entity_types: ['dragons'] }` leaving nothing stored (`getSetting` returns `null`) — catches a filter that persists a type the Add tab cannot list.

### Frontend

`EncounterSidePanel.tsx` (no props)

- Purpose: the right column; hosts the tab header and the tab body.
- Behavior: no state; a static header with the single label "Add", then `EncounterAddTab`.
- UI / Visual: a `GlassPanel` with class `encounter-side-panel`, a flex column with `min-height: 0`; the header is a `span` of class `encounter-side-panel-tab` in a `div.encounter-side-panel-tabs`; `index.ts` exports `EncounterSidePanel` explicitly.

`EncounterAddTab.tsx` (no props)

- Purpose: find a base entity and add combatants of it.
- Behavior: `adventureId` from the route; `useAdventureBaseEntities(adventureId)`, showing the loading icon in `div.content-center` while loading; `useSetting('encounterAddFilter')` with `selectedTypes = value?.entity_types ?? []`. The search is a `SearchInput` (placeholder "Search entities...") whose `onSearch` sets a term state. The list is `useListFilter` (from `@/hooks/useListFilter`) applied to `filterByEntityTypes(sortEntitiesByName(baseEntities), selectedTypes)` with a module-level `{ searchableColumns: ['name', 'description'] }` annotated `{ searchableColumns: ('name' | 'description')[] }`, shown as `[...nameMatches, ...fieldMatches]`. The type filter renders one `Checkbox` per member of `BASE_ENTITY_TYPES` with `id` `encounter-add-type-<type>`, `checked` from `selectedTypes`, and a `label` whose `htmlFor` is that id, showing `entityTypeLabel(type)` (a `label` cannot wrap `Checkbox`: it renders a `div`, and `label` holds phrasing content only, `.claude/knowledge/html.md`, the entry beginning "A `label` element may hold phrasing content"); `onChange` calls `update({ entity_types: toggleEntityType(selectedTypes, type) })`. With no entity in the adventure it shows the line "This adventure has no entities yet."; otherwise, with an empty visible list, the list's only item reads "No results found".
- UI / Visual: the type filter and the search sit above a `ul.encounter-add-tab-list` that scrolls (`flex: 1`, `min-height: 0`, `overflow-y: auto`); its children are `EncounterAddRow` items (each renders its own `li`) or the one no-results `li`. All values are tokens.

Helpers in `EncounterAddTab/helper/`, each with a test: `sortEntitiesByName(entities: BaseEntity[]): BaseEntity[]` returns a new array, named entities ordered by `localeCompare` of their names, entities with a `null` name after them in input order; `filterByEntityTypes(entities: BaseEntity[], selected: BaseEntityType[]): BaseEntity[]` returns every entity for an empty selection and else those whose `entity_type` is selected; `toggleEntityType(selected: BaseEntityType[], entityType: BaseEntityType): BaseEntityType[]` removes the type when present, else appends it. [spec-writer_15: ran `npx tsc --noEmit` and `npx eslint` on a scratch file in `EncounterAddTab/helper/` declaring these three signatures — observed no type error and only the unused-export lint report] Test behaviors: names A to Z with unnamed entities last and the input array left unchanged; an empty selection keeps all six types and a selection drops the others; toggling adds an absent type at the end and removes a present one, leaving the others — catches a toggle that replaces the selection.

`EncounterAddRow.tsx` (props `{ baseEntity: BaseEntity }`, `FCProps<Props>`)

- Purpose: one entity row of the Add tab.
- Behavior: `encounterId` from the route; `addEntityCombatants` and `isAdding` from `useEncounterQueueItems(encounterId)`, which the row calls itself (`.claude/rules/src-components.md` — Framework context is not a prop). State: `quantityText` (string, starts `'1'`) and `lastValidQuantity` (number, starts 1). The quantity is `parseAddQuantity(quantityText)`. The quantity field is the `Input` primitive with `type='number'`, `min`/`max` from `MIN_ADD_QUANTITY`/`MAX_ADD_QUANTITY` and `aria-label='Quantity'`; `onChange` sets `quantityText` and, when `parseAddQuantity(event.currentTarget.value)` is not `null`, sets `lastValidQuantity`; `onBlur` sets `quantityText` to `String(lastValidQuantity)`. A number input holding text it cannot convert reads as `''`, which `parseAddQuantity` rejects, so an unreadable value disables Add and reverts on blur. The `Button` labelled "Add" is `disabled` when the quantity is `null` or `isAdding`; its `onClick` runs `void handleAdd()`, which returns for a `null` quantity, awaits `addEntityCombatants(baseEntity.entity_type, baseEntity.id, quantity)`, then resets both quantity states to 1.
- UI / Visual: the root is an `li` (class `encounter-add-row`): `EncounterEntityImage` (SF5) given `baseEntity.image_id` as `imageId` and `size` 48 (the literal 48 is written here and nowhere else), imported as `../../../../../EncounterEntityImage/EncounterEntityImage`; a text block with the name (`baseEntity.name ?? UNTITLED_COMBATANT_NAME`, class `clip-text`) above `entityTypeLabel(baseEntity.entity_type)`, the quantity field with a fixed two-digit width from spacing tokens, and the Add button. `EncounterAddRow` has no `index.ts`; `EncounterAddTab` imports it as `./components/EncounterAddRow/EncounterAddRow`. The row has no stylesheet rule for the image: the icon rule lives in `EncounterEntityImage.css` (KAD "The queue entry and the Add row share one `EncounterEntityImage` component").

Test behaviors (component tests per `.claude/rules/src-unit-tests.md` — Component tests; `@tanstack/react-router` mocked to answer `useParams`, `@services/encounterQueueService` mocked, rendered with `{ wrapper: TanstackQueryClientProvider }`):

- `EncounterAddRow.test.tsx`: typing 5, clearing the field and leaving it puts 5 back — catches a revert to the initial 1 or to an invalid text; Add is disabled for 0, 100, an empty field and 1.5 and enabled for 1 and 99 — catches an off-by-one range; clicking Add calls the service with the entity type, the entity id, the quantity and the route's encounter id; while the service promise is pending the Add buttons of two rendered rows are both disabled, and after it resolves they are enabled and the quantity is back to 1 — catches a per-row pending flag and a quantity that stays after an Add
- `EncounterAddTab.test.tsx` (also mocks `@services/baseEntityService` and `@db/_settings`; search under `vi.useFakeTimers({ shouldAdvanceTime: true })` with `await act(() => vi.runOnlyPendingTimersAsync())`): with nothing saved all types are listed by name; checking a type saves its list together with the types already saved, and unchecking removes it — catches overwriting the selection; a saved selection lists only its types; typing a term narrows by name and by description with name matches first — catches the two match groups concatenated the wrong way round; an adventure without entities shows its line, and a search without match shows "No results found"

[MANUAL-VERIFY] The right column shows the "Add" header, the six type boxes, the search and the scrolling list of rows with image, name and type label (browser pane).

[MANUAL-VERIFY] The type filter survives leaving the encounter and opening another encounter (browser pane) and restarting the app (hand test on the native host, for the human tester).

[MANUAL-VERIFY] Adding three of an entity whose single stat block has HP 7 puts "Goblin 1", "Goblin 2" and "Goblin 3" at the end of the queue, each `7 / 7`, and the quantity field returns to 1 (browser pane).
