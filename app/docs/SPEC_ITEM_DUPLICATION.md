# Spec: Item Screen Duplication

Adds a "Duplicate <Entity>" control to every item screen sidebar. Duplicating copies the record's current persisted state — including its image and, for Sessions, its steps — under a new id with no name, then navigates to the new record with its name input focused.

## Progress tracker

- Sub-feature 1: Canonical entity registry — promote entity vocabulary out of `domain/mentions/` into `domain/entities/` and widen it to all eight entities
- Sub-feature 2: Breadcrumbs consume the registry — replace `BreadcrumbConfig`'s inlined entity kinds with the canonical `EntityType`
- Sub-feature 3: Image duplication — copy an image's file and row so a duplicate owns its own image
- Sub-feature 4: Leaf entity duplication — DB, domain error, and service duplication for NPC, PC, Foe, Faction, Location, Item
- Sub-feature 5: Session duplication — session row plus all of its session steps
- Sub-feature 6: DAL duplication hooks — expose `duplicate<Entity>` on the seven item hooks
- Sub-feature 7: `ScreensDuplicateBtn` — the shared control, its seven per-entity leaves, and the focus navigation signal
- Sub-feature 8: Sidebar wiring and focus-on-arrival — place the control in all eight sidebars and focus the name input on the duplicate's screen

No sub-feature meets the Foundation criteria: SF1 updates every consumer it affects within its own commit, and no later sub-feature adds exports that an earlier one already imports.

## Key Architectural Decisions

### Entity vocabulary is a domain concern, not a mentions concern

`MENTIONABLE_ENTITY_TYPES`, `ENTITY_TYPE_LABELS`, `ENTITY_SEGMENT`, and `buildEntityPath` currently live under `domain/mentions/`, but they describe what entities exist, what they are called, and where they live in the route tree — facts that breadcrumbs, sidebars, and duplication all need. They move to a new `domain/entities/` module and are renamed to drop the mention-specific framing: `ENTITY_TYPES`, `EntityType`, `isEntityType`. `domain/mentions/` retains only `mentionSearchError`. Root `CLAUDE.md`'s rule on duplicated semantic mappings drives this: a second domain-to-label map introduced for sidebar button labels would be a third independent copy of the same mapping.

### The registry has eight members, including `adventures`

`adventures` was absent from the mentionable list while `sessions` was present, despite both being seeded `tagging_enabled: 0`. Membership in this list is not derived from that column: `searchMentions` filters on `tagging_enabled === 1` at runtime, and the setting is user-toggleable from the Settings screen. The list is therefore the set of entities that *can* be tagged, and `sessions`' presence at `tagging_enabled: 0` demonstrates it. `adventures`' absence was an omission with a reachable failure: enabling adventure tagging in Settings produced search hits whose mention resolution reported the entity deleted and whose path construction threw. Adding `adventures` to `ENTITY_TYPES`, `ENTITY_TYPE_LABELS`, and `ENTITY_SEGMENT` closes it.

### `buildEntityPath` requires no branch for adventures

An adventure's item screen is `/adventure/{id}`, structurally unlike the `/adventure/{adventureId}/{segment}/{entityId}` shape of every other entity. No special case is needed: `adventures` is configured `scope: 'global'`, so callers pass `adventureId: null`, and the existing null branch already produces `` `/${segment}/${entityId}` `` — which is `/adventure/{id}` once `ENTITY_SEGMENT.adventures` is `'adventure'`.

### Duplicability is declared by a switch, not by a list

`ScreensDuplicateBtn` switches on entity type and renders a per-entity leaf; its `adventures` case returns `null`. No `DUPLICABLE_ENTITY_TYPES` constant exists. The switch is the single declaration of what can be duplicated, so the component can be placed in all eight sidebars unconditionally and adventure duplication later becomes a one-case change. This deliberately avoids a second seven-member list that would be equal to the mentionable set today by coincidence and diverge the moment adventure duplication ships.

### Per-entity leaf components are structurally required

A single component receiving an entity-type prop cannot call `useNpc` versus `usePc` off that prop — hooks cannot be called conditionally. Consolidating into one generic duplication hook fails for a second, independent reason: invalidation needs each module's query key factory, and `app/src/CLAUDE.md` bars key factories from module barrels, so a shared hook cannot reach them. Seven leaves, each calling its own `use<Entity>` hook and owning its own duplicate-and-navigate action, is the only shape satisfying both constraints. It also satisfies `app/src/CLAUDE.md`'s rule that a component owning a button owns that button's action.

### Duplication is a DB-layer operation, not `create` followed by `update`

Each domain gets `db/<domain>/duplicate.ts` performing a single INSERT built from the source row. Composing the existing `create` and `update` primitives is rejected on three grounds: `create` writes a generated placeholder name and, for NPCs, a summary template that would immediately be overwritten; the generated update schemas type nullable text columns as `z.string().optional()`, so an update cannot write `null` to `name`; and `sessionService.createSession` seeds eight default `session_steps`, which a session duplicate must not receive on top of its copied steps.

### A duplicate is created with no name

`name` is omitted from the duplicate's INSERT, so the column takes SQL `NULL`. Every item screen already renders `name ?? ''`, so the input displays empty with no additional handling. This is what signals to the user that duplication occurred, and it is why every other field is copied verbatim.

### A duplicate owns its own image

Duplicates never share `image_id` with their source. Each entity service's delete path calls `imageService.deleteImage` on the entity's `image_id`, so a shared row would mean deleting either record destroys the other's image. `db/image/duplicate.ts` copies the file via the existing `read_image_bytes` and `save_image_bytes` commands and inserts a new row carrying `file_extension`, `original_filename`, `file_size`, and the framing values `frame_x`, `frame_y`, `frame_zoom`. The framing values are copied explicitly because nothing writes them at create time — only `imageService.updateImageFrame` does — so omitting them would silently discard the user's crop and zoom.

### Write order is image, then entity, then steps

`db/_sync/registry.ts` declares that synced upserts apply parents before children, listing `images` first, entity tables next, and `session_steps` after `sessions`. Duplication writes in that same order so the rows it produces are consistent with the order the sync layer will replay them in.

### The focus signal travels as router navigation state

The duplicating leaf navigates with `state: { focusNameInput: true }`, and the destination screen reads it via `useRouterState`. `HistoryState` is an empty interface, so a module augmentation declaring the field is required — without it the field is not type-permitted. Navigation state is chosen over a search param because no route currently declares `validateSearch` and adding it to seven routes to carry a transient UI flag is disproportionate, and because the signal must not survive a reload: reopening the URL should not re-focus. Focusing on "name is empty" is rejected — `name` is nullable and user-clearable, so any record whose name the user cleared would re-focus on every later visit.

## Sub-feature files

- [SF1 — Canonical entity registry](SPEC_ITEM_DUPLICATION_SF1.md)
- [SF2 — Breadcrumbs consume the registry](SPEC_ITEM_DUPLICATION_SF2.md)
- [SF3 — Image duplication](SPEC_ITEM_DUPLICATION_SF3.md)
- [SF4 — Leaf entity duplication](SPEC_ITEM_DUPLICATION_SF4.md)
- [SF5 — Session duplication](SPEC_ITEM_DUPLICATION_SF5.md)
- [SF6 — DAL duplication hooks](SPEC_ITEM_DUPLICATION_SF6.md)
- [SF7 — ScreensDuplicateBtn](SPEC_ITEM_DUPLICATION_SF7.md)
- [SF8 — Sidebar wiring and focus-on-arrival](SPEC_ITEM_DUPLICATION_SF8.md)

## CLAUDE.md impact

`app/docs/_product/domain-scaffold.md`'s "MentionPopup Registration" section states that `domain/mentions/entityTypes.ts` holds the canonical list and that a domain must be registered there when its `tagging_enabled` is `1`. Both facts become wrong with SF1: the list moves to `domain/entities/entityTypes.ts` and its membership rule is "every domain entity that can be tagged", independent of the current `tagging_enabled` value. `sessions` is listed at `tagging_enabled: 0` and `searchMentions` filters on that column at runtime, so the column never gated list membership [S_1: app/db/_migrations/1780099200000_seed_table_config.ts:21-23 — sessions seeded tagging_enabled 0; app/services/mentionSearchService.ts:20 — filters tagging_enabled === 1]. The section's file paths for `buildEntityPath.ts` and `entityTypeLabels.ts` are likewise stale.

`app/docs/_product/domain-scaffold.md` has no section covering duplication. Every entity added after this spec needs `db/<domain>/duplicate.ts`, a `duplicate<Entity>` service function, a `<domain>DuplicateError` factory, a `duplicate<Entity>` DAL hook function, and a case in `ScreensDuplicateBtn`'s switch — a registration flow with five participation points that the scaffold does not describe.

`app/src/CLAUDE.md`'s Screens section does not describe `src/screens/components/` as the home for components shared across screen sidebars, nor the `Screens` name prefix its three existing members follow [S_2: app/src/screens/components/index.ts — exports ScreensTextEditorLayout, ScreensSummary, ScreensNameInput]. SF7 adds a fourth member under that convention.
