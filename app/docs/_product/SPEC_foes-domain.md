# Foes Domain — Spec

Generated from `app/docs/_product/domain-scaffold.md` for domain: `Foe` / `Foes`.

## Progress Tracker

- SF1: DB Layer — schema, types, CRUD, tests, database.ts registration
- SF2: Domain Layer — error types, domain barrel, grouping barrel update
- SF3: Service Layer — foesService.ts
- SF4: DAL — foeKeys, useFoes, useFoe, DAL barrel update
- SF5: Screens — FoesScreen (list) + FoeScreen + FoeHeader + FoeSidebar (detail)
- SF6: Routes + Barrel registrations — route files, screens/index.ts, data-access-layer/index.ts
- SF7: Breadcrumbs + Seed — FoeCrumb, buildBreadcrumbs, BreadcrumbList, seed.ts

## Key Architectural Decisions

**All new files; no NPC files are copied or modified.** Each layer is written fresh
following the NPC domain as a pattern reference. This ensures clean domain separation and
avoids NPC-specific implementation details bleeding into the Foe domain.

**Adventure-scoped domain.** The `foes` table includes `adventure_id` as a NOT NULL FK
referencing `adventures.id` ON DELETE CASCADE. All queries are filtered by `adventureId`.
The table config `scope` is `'adventure'`.

**Base schema only.** Foes use the standard eight columns (id, adventure_id, name, summary,
description, image_id, created_at, updated_at). No domain-specific columns are added.

**Image lifecycle owned by the service layer.** `foesService` owns `removeFoeImage` as a
single-step operation — the component never calls `deleteImage` and `updateFoe` separately,
because failure of the FK update after image deletion would leave the entity in an
inconsistent state.

**Summary template is Foe-specific.** `create.ts` pre-fills the summary field with a
TTRPG-appropriate Lexical JSON template covering Type/CR/Alignment, Habitat, Special
Abilities, and Tactics. This matches the NPC pattern of providing structured placeholder
content at creation time.

**Table config color `'#e67e22'`** (orange). Distinct from NPCs (`'#ff6b6b'` red) and
Sessions (`'#51cf66'` green).

**SF symbol consumers.** SF1 exports `Foe` and `UpdateFoeInput` — consumed by SF3.
SF2 exports Foe error factories — consumed by SF3. SF3 exports service functions —
consumed by SF4. SF4 exports DAL hooks — consumed by SF5. SF5 exports `FoesScreen` and
`FoeScreen` — wired into `screens/index.ts` in SF6. SF6 creates route files that are
registered automatically by TanStack Router file conventions (routeTree.gen.ts regenerates
on next dev server start). SF7 exports `FoeCrumb` — consumed within SF7 by BreadcrumbList.

## Sub-Feature Files

- [SF1: DB Layer](SPEC_foes-domain_SF1.md)
- [SF2: Domain Layer](SPEC_foes-domain_SF2.md)
- [SF3: Service Layer](SPEC_foes-domain_SF3.md)
- [SF4: DAL](SPEC_foes-domain_SF4.md)
- [SF5: Screens](SPEC_foes-domain_SF5.md)
- [SF6: Routes + Barrel registrations](SPEC_foes-domain_SF6.md)
- [SF7: Breadcrumbs + Seed](SPEC_foes-domain_SF7.md)

## CLAUDE.md Impact

`app/docs/CLAUDE.md` — add a note: "`domain-scaffold.md` is a long-living infrastructure
reference document. It is NOT a temporary spec and must not be deleted after implementation.
Update it when core domain infrastructure changes (new layers, changed conventions, new
ambient systems)."
