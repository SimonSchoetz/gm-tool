# Items Domain — Spec

Generated from `app/docs/_product/domain-scaffold.md` for domain: `Item` / `Items`.

## Progress Tracker

- SF1: DB Layer — schema, types, CRUD, tests, database.ts registration
- SF2: Domain Layer — error types, domain barrel, grouping barrel update
- SF3: Service Layer — itemsService.ts
- SF4: DAL — itemKeys, useItems, useItem, DAL barrel update
- SF5: Screens — ItemsScreen (list) + ItemScreen + ItemHeader + ItemSidebar (detail) `[commit together with SF6 — SF5 imports from @/data-access-layer which does not export useItem/useItems until SF6 barrel update lands; tsc fails on SF5 alone]`
- SF6: Routes + Barrel registrations — route files, screens/index.ts, data-access-layer/index.ts
- SF7: Breadcrumbs + Seed — ItemCrumb, buildBreadcrumbs, BreadcrumbList, seed.ts

## Key Architectural Decisions

**All new files; no NPC or Foe files are copied or modified.** Each layer is written fresh
following the NPC domain as a pattern reference. This ensures clean domain separation and
avoids NPC-specific implementation details bleeding into the Item domain.

**Adventure-scoped domain.** The `items` table includes `adventure_id` as a NOT NULL FK
referencing `adventures.id` ON DELETE CASCADE. All queries are filtered by `adventureId`.
The table config `scope` is `'adventure'`.

**Base schema only.** Items use the standard eight columns (id, adventure_id, name,
summary, description, image_id, created_at, updated_at). No domain-specific columns.

**Image lifecycle owned by the service layer.** `itemsService` owns `removeItemImage`
as a single-step operation — the component never calls `deleteImage` and `updateItem`
separately, because failure of the FK update after image deletion would leave the entity in
an inconsistent state.

**Summary template is Item-specific.** `create.ts` pre-fills the summary field with a
TTRPG-appropriate Lexical JSON template covering Type/Rarity/Value, Properties/Weight,
Origin/Owner, Effects/Attunement, and History/Secrets.

**Table config color `'#9b59b6'`** (purple). Distinct from NPCs (`'#ff6b6b'` red),
Foes (`'#e67e22'` orange), Factions (`'#f39c12'` gold), Locations (`'#2ecc71'` emerald),
and Sessions (`'#51cf66'` green).

**SF symbol consumers.** SF1 exports `Item` and `UpdateItemInput` — consumed by SF3.
SF2 exports Item error factories — consumed by SF3. SF3 exports service functions —
consumed by SF4. SF4 exports DAL hooks — consumed by SF5. SF5 exports `ItemsScreen` and
`ItemScreen` — wired into `screens/index.ts` in SF6. SF6 creates route files that are
registered automatically by TanStack Router file conventions (routeTree.gen.ts regenerates
on next dev server start). SF7 exports `ItemCrumb` — consumed within SF7 by BreadcrumbList.

## Reference Implementation

All files follow the NPC domain as a reference implementation with systematic name
substitution. Before using any NPC file as a template, verify it against current CLAUDE.md
conventions — the reference implementation may have drifted.

Name substitution table:

| NPC (source) | Item (target) |
|---|---|
| `npcs` (table/plural) | `items` |
| `npc` (singular lower) | `item` |
| `Npc` / `NPC` | `Item` / `ITEM` |
| `Npcs` / `NPCs` | `Items` / `Items` |
| `@db/npc` | `@db/item` |
| `@domain/npcs` | `@domain/items` |
| `@services/npcsService` | `@services/itemsService` |
| `data-access-layer/npcs/` | `data-access-layer/items/` |
| `screens/npcs/`, `screens/npc/` | `screens/items/`, `screens/item/` |

## routeTree.gen.ts

`routeTree.gen.ts` is gitignored. After creating the two route files in SF6, manually add
the new route entries to `src/routeTree.gen.ts` so that `tsc --noEmit` passes during
implementation. This edit does not need to be committed — the dev server regenerates the
file correctly from the route files on first start.

## Sub-Feature Files

- [SF1: DB Layer](SPEC_items-domain_SF1.md)
- [SF2: Domain Layer](SPEC_items-domain_SF2.md)
- [SF3: Service Layer](SPEC_items-domain_SF3.md)
- [SF4: DAL](SPEC_items-domain_SF4.md)
- [SF5: Screens](SPEC_items-domain_SF5.md)
- [SF6: Routes + Barrel registrations](SPEC_items-domain_SF6.md)
- [SF7: Breadcrumbs + Seed](SPEC_items-domain_SF7.md)

## CLAUDE.md Impact

None.
