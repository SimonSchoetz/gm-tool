# Factions Domain — Spec

Generated from `app/docs/_product/domain-scaffold.md` for domain: `Faction` / `Factions`.

## Progress Tracker

- SF1: DB Layer — schema, types, CRUD, tests, database.ts registration
- SF2: Domain Layer — error types, domain barrel, grouping barrel update
- SF3: Service Layer — factionsService.ts
- SF4: DAL — factionKeys, useFactions, useFaction, DAL barrel update
- SF5: Screens — FactionsScreen (list) + FactionScreen + FactionHeader + FactionSidebar (detail) `[commit together with SF6 — SF5 imports from @/data-access-layer which does not export useFaction/useFactions until SF6 barrel update lands; tsc fails on SF5 alone]`
- SF6: Routes + Barrel registrations — route files, screens/index.ts, data-access-layer/index.ts
- SF7: Breadcrumbs + Seed — FactionCrumb, buildBreadcrumbs, BreadcrumbList, seed.ts

## Key Architectural Decisions

**All new files; no NPC or Foe files are copied or modified.** Each layer is written fresh
following the NPC domain as a pattern reference. This ensures clean domain separation and
avoids NPC-specific implementation details bleeding into the Faction domain.

**Adventure-scoped domain.** The `factions` table includes `adventure_id` as a NOT NULL FK
referencing `adventures.id` ON DELETE CASCADE. All queries are filtered by `adventureId`.
The table config `scope` is `'adventure'`.

**Base schema only.** Factions use the standard eight columns (id, adventure_id, name,
summary, description, image_id, created_at, updated_at). No domain-specific columns.

**Image lifecycle owned by the service layer.** `factionsService` owns `removeFactionImage`
as a single-step operation — the component never calls `deleteImage` and `updateFaction`
separately, because failure of the FK update after image deletion would leave the entity in
an inconsistent state.

**Summary template is Faction-specific.** `create.ts` pre-fills the summary field with a
TTRPG-appropriate Lexical JSON template covering Leader/Type/Alignment, Territory/Headquarters,
Goals/Resources/Rivals, Ranks/Membership, and History/Secrets.

**Table config color `'#f39c12'`** (yellow/gold). Distinct from NPCs (`'#ff6b6b'` red),
Foes (`'#e67e22'` orange), PCs (`'#1abc9c'` teal), and Sessions (`'#51cf66'` green).

**SF symbol consumers.** SF1 exports `Faction` and `UpdateFactionInput` — consumed by SF3.
SF2 exports Faction error factories — consumed by SF3. SF3 exports service functions —
consumed by SF4. SF4 exports DAL hooks — consumed by SF5. SF5 exports `FactionsScreen` and
`FactionScreen` — wired into `screens/index.ts` in SF6. SF6 creates route files that are
registered automatically by TanStack Router file conventions (routeTree.gen.ts regenerates
on next dev server start). SF7 exports `FactionCrumb` — consumed within SF7 by BreadcrumbList.

## Reference Implementation

All files follow the NPC domain as a reference implementation with systematic name
substitution. Before using any NPC file as a template, verify it against current CLAUDE.md
conventions — the reference implementation may have drifted.

Name substitution table:

| NPC (source) | Faction (target) |
|---|---|
| `npcs` (table/plural) | `factions` |
| `npc` (singular lower) | `faction` |
| `Npc` / `NPC` | `Faction` / `FACTION` |
| `Npcs` / `NPCs` | `Factions` / `Factions` |
| `@db/npc` | `@db/faction` |
| `@domain/npcs` | `@domain/factions` |
| `@services/npcsService` | `@services/factionsService` |
| `data-access-layer/npcs/` | `data-access-layer/factions/` |
| `screens/npcs/`, `screens/npc/` | `screens/factions/`, `screens/faction/` |

## routeTree.gen.ts

`routeTree.gen.ts` is gitignored. After creating the two route files in SF6, manually add
the new route entries to `src/routeTree.gen.ts` so that `tsc --noEmit` passes during
implementation. This edit does not need to be committed — the dev server regenerates the
file correctly from the route files on first start.

## Sub-Feature Files

- [SF1: DB Layer](SPEC_factions-domain_SF1.md)
- [SF2: Domain Layer](SPEC_factions-domain_SF2.md)
- [SF3: Service Layer](SPEC_factions-domain_SF3.md)
- [SF4: DAL](SPEC_factions-domain_SF4.md)
- [SF5: Screens](SPEC_factions-domain_SF5.md)
- [SF6: Routes + Barrel registrations](SPEC_factions-domain_SF6.md)
- [SF7: Breadcrumbs + Seed](SPEC_factions-domain_SF7.md)

## CLAUDE.md Impact

None.
