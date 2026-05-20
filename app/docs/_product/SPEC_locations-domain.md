# Locations Domain — Spec

Generated from `app/docs/_product/domain-scaffold.md` for domain: `Location` / `Locations`.

## Progress Tracker

- SF1: DB Layer — schema, types, CRUD, tests, database.ts registration
- SF2: Domain Layer — error types, domain barrel, grouping barrel update
- SF3: Service Layer — locationsService.ts
- SF4: DAL — locationKeys, useLocations, useLocation, DAL barrel update
- SF5: Screens — LocationsScreen (list) + LocationScreen + LocationHeader + LocationSidebar (detail) `[commit together with SF6 — SF5 imports from @/data-access-layer which does not export useLocation/useLocations until SF6 barrel update lands; tsc fails on SF5 alone]`
- SF6: Routes + Barrel registrations — route files, screens/index.ts, data-access-layer/index.ts
- SF7: Breadcrumbs + Seed — LocationCrumb, buildBreadcrumbs, BreadcrumbList, seed.ts

## Key Architectural Decisions

**All new files; no NPC or Foe files are copied or modified.** Each layer is written fresh
following the NPC domain as a pattern reference. This ensures clean domain separation and
avoids NPC-specific implementation details bleeding into the Location domain.

**Adventure-scoped domain.** The `locations` table includes `adventure_id` as a NOT NULL FK
referencing `adventures.id` ON DELETE CASCADE. All queries are filtered by `adventureId`.
The table config `scope` is `'adventure'`.

**Base schema only.** Locations use the standard eight columns (id, adventure_id, name,
summary, description, image_id, created_at, updated_at). No domain-specific columns.

**Image lifecycle owned by the service layer.** `locationsService` owns `removeLocationImage`
as a single-step operation — the component never calls `deleteImage` and `updateLocation`
separately, because failure of the FK update after image deletion would leave the entity in
an inconsistent state.

**Summary template is Location-specific.** `create.ts` pre-fills the summary field with a
TTRPG-appropriate Lexical JSON template covering Type/Region/Climate, Notable Features/Hazards,
Factions/Key NPCs, History/Secrets, and Stat Block/Travel Notes.

**Table config color `'#2ecc71'`** (emerald green). Distinct from NPCs (`'#ff6b6b'` red),
Foes (`'#e67e22'` orange), Factions (`'#f39c12'` gold), and Sessions (`'#51cf66'` green).

**SF symbol consumers.** SF1 exports `Location` and `UpdateLocationInput` — consumed by SF3.
SF2 exports Location error factories — consumed by SF3. SF3 exports service functions —
consumed by SF4. SF4 exports DAL hooks — consumed by SF5. SF5 exports `LocationsScreen` and
`LocationScreen` — wired into `screens/index.ts` in SF6. SF6 creates route files that are
registered automatically by TanStack Router file conventions (routeTree.gen.ts regenerates
on next dev server start). SF7 exports `LocationCrumb` — consumed within SF7 by BreadcrumbList.

## Reference Implementation

All files follow the NPC domain as a reference implementation with systematic name
substitution. Before using any NPC file as a template, verify it against current CLAUDE.md
conventions — the reference implementation may have drifted.

Name substitution table:

| NPC (source) | Location (target) |
|---|---|
| `npcs` (table/plural) | `locations` |
| `npc` (singular lower) | `location` |
| `Npc` / `NPC` | `Location` / `LOCATION` |
| `Npcs` / `NPCs` | `Locations` / `Locations` |
| `@db/npc` | `@db/location` |
| `@domain/npcs` | `@domain/locations` |
| `@services/npcsService` | `@services/locationsService` |
| `data-access-layer/npcs/` | `data-access-layer/locations/` |
| `screens/npcs/`, `screens/npc/` | `screens/locations/`, `screens/location/` |

## routeTree.gen.ts

`routeTree.gen.ts` is gitignored. After creating the two route files in SF6, manually add
the new route entries to `src/routeTree.gen.ts` so that `tsc --noEmit` passes during
implementation. This edit does not need to be committed — the dev server regenerates the
file correctly from the route files on first start.

## Sub-Feature Files

- [SF1: DB Layer](SPEC_locations-domain_SF1.md)
- [SF2: Domain Layer](SPEC_locations-domain_SF2.md)
- [SF3: Service Layer](SPEC_locations-domain_SF3.md)
- [SF4: DAL](SPEC_locations-domain_SF4.md)
- [SF5: Screens](SPEC_locations-domain_SF5.md)
- [SF6: Routes + Barrel registrations](SPEC_locations-domain_SF6.md)
- [SF7: Breadcrumbs + Seed](SPEC_locations-domain_SF7.md)

## CLAUDE.md Impact

None.
