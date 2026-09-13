# Domain Scaffold

Reference document for adding a new base entity type to the shared base-entity stack. Hand
to `/write-specs` along with the new type's identifiers to generate a concrete,
/implement-ready spec.

This document does not scaffold new standalone domains (a domain with its own db, domain,
service, and DAL stack — e.g. Sessions, Encounters, Adventures). Those remain out of its
scope; it covers only adding one more entry to `BASE_ENTITY_TYPES`.

This document is long-lived. Update it when core infrastructure changes (new layers,
changed conventions, new ambient systems). Do not delete it when specs are implemented.

## Usage

```text
/write-specs "Register a new base entity type named [SINGULAR] (plural: [PLURAL]) following
app/docs/_product/domain-scaffold.md.
Customizations:
- Display label: [PascalCase singular label, e.g. 'Foe', or an acronym like 'NPC'/'PC']
- Summary template lines: [list placeholder lines for the rich-text summary, or 'base pattern']
- Table config color: [rgb string, e.g. '248, 255, 255']
- Search hint word: [the one type-specific word shown in the list screen's search placeholder]
- tagging_enabled: [0 or 1, default 1]
- scope: ['adventure' or 'global', default 'adventure']"
```

/write-specs will verify all paths and imports against the current codebase before writing.
All identifiers are derived from the naming conventions below — supply only the
customizations above.

## Naming Conventions

Given a singular/plural pair (example: `Foe` / `Foes`), the per-type values a new base
entity type supplies:

| Identifier | Rule | Example |
| --- | --- | --- |
| Entity type | plural lowercase, a `BASE_ENTITY_TYPES` member, equal to `table_config.table_name` | `'foes'` |
| Route segment | singular lowercase | `foe` |
| List route file | `adventure.$adventureId.[plural].tsx` | `adventure.$adventureId.foes.tsx` |
| Detail route file | `adventure.$adventureId.[singular].$baseEntityId.tsx` | `adventure.$adventureId.foe.$baseEntityId.tsx` |
| URL id param | always `baseEntityId` | `baseEntityId` |
| Display label | PascalCase singular, or an acronym for `npcs`/`pcs` | `'Foe'` |
| Breadcrumb kind | same value as the entity type | `'foes'` |

Every base entity type shares these modules — nothing per-type is created for any of them:

| Module | Path |
| --- | --- |
| DB layer | `db/base-entity/` |
| Domain layer | `domain/base-entities/` |
| Service layer | `services/baseEntityService.ts` |
| Data Access Layer | `data-access-layer/base-entities/` |
| List screen | `screens/base-entities/BaseEntitiesScreen.tsx` |
| Detail screen | `screens/base-entity/BaseEntityScreen.tsx` with `components/BaseEntitySidebar/` |
| Mention popup | `BaseEntityPopupContent` |
| Duplicate button | `BaseEntityDuplicateBtn` |
| Breadcrumb crumb | `BaseEntityCrumb` |

## Shared Columns

Every base entity type is a row of `base_entities`, discriminated by `entity_type`. Do not
add or remove a column without explicit user instruction.

| Column | SQL type | Nullable | Zod | Notes |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` PRIMARY KEY | No | `z.string()` | nanoid, generated in `create.ts` |
| `adventure_id` | `TEXT` NOT NULL | No | `z.string()` | FK → `adventures.id` ON DELETE CASCADE |
| `entity_type` | `TEXT` NOT NULL | No | `z.enum(BASE_ENTITY_TYPES)` | discriminator |
| `name` | `TEXT` | Yes | `z.string().nullable()` | user-editable, must be nullable (auto-save rule) |
| `summary` | `TEXT` | Yes | `z.string().nullable()` | Lexical JSON; template set in `create.ts` |
| `description` | `TEXT` | Yes | `z.string().nullable()` | Lexical JSON; no default template |
| `image_id` | `TEXT` | Yes | `z.string().nullable()` | FK → `images.id` ON DELETE SET NULL |
| `pinned_order` | `INTEGER` | Yes | `z.number().nullable()` | `NULL` = unpinned; non-null = ascending pin position |
| `created_at` | `TEXT` NOT NULL | No | `z.string()` | ISO 8601 UTC, set in `create.ts` |
| `updated_at` | `TEXT` NOT NULL | No | `z.string()` | ISO 8601 UTC, set by `buildUpdateQuery` |

`app/db/CLAUDE.md` bans `.optional()` on any `zodSchema` field, and the ban applies
unconditionally. `db/base-entity/schema.ts` uses `.nullable()` alone on every nullable
column, including `image_id` — no field on this table is grandfathered.

## Implementation Notes

**Validate reference implementations before replicating.** Before using any file as a
pattern reference, verify it against current CLAUDE.md conventions. Convention changes
retroactively invalidate previously correct code — a stale reference propagates violations
to every new registration that copies it. When a violation is found during this check, fix
it before using the file as a template.

**`routeTree.gen.ts` is gitignored and does not need manual editing.** After creating the
new route files, run `pnpm run build:frontend` once from `app/`. The `tanstackRouter`
plugin registered in `vite.config.ts` rewrites `src/routeTree.gen.ts` from the route files
during the build, which is what makes the new route ids available to `tsc --noEmit`,
`useParams({ strict: false })`, and typed `<Link to=... />`. The file stays gitignored and
is never committed.

## Layer Patterns

Registering a new base entity type touches every layer in `app/docs/CLAUDE.md`'s Layered
breakdown order. No layer gains a new per-type file or directory — every change below is an
entry added to an existing shared table, map, or switch.

### Domain

- Add the plural to `BASE_ENTITY_TYPES` (`domain/entities/entityTypes.ts`). `ENTITY_TYPES`
  is built from it, so no separate registration is needed there.
- Add an entry to `ENTITY_SEGMENT` (`domain/entities/buildEntityPath.ts`) — the route's
  singular path segment.
- Add an entry to `ENTITY_TYPE_LABELS` (`domain/entities/entityTypeLabels.ts`) — the
  display label shown by `entityTypeLabel`.
- Add an entry to `BASE_ENTITY_SEARCH_HINTS` (`domain/entities/baseEntitySearchHints.ts`) —
  the one type-specific word the list screen's search placeholder shows.
- Add the corresponding assertion to each accessor's test file
  (`entityTypes.test.ts`, `buildEntityPath.test.ts` if it asserts per-type segments,
  `baseEntitySearchHints.test.ts`).

### Database

- Add a `SUMMARY_TEMPLATES` entry in `db/base-entity/create.ts` — the new type's Lexical
  JSON summary template string.
- Add a migration that inserts only the new type's `table_config` row — no table and no
  triggers, since `base_entities` and its sync triggers already exist. Follow the
  `WHERE NOT EXISTS` form in `db/_migrations/1780099200000_seed_table_config.ts`:

  ```ts
  import type Database from '@tauri-apps/plugin-sql';
  import { generateId, generateDbTimestamps } from '../util';

  const config = {
    table_name: '[plural]',
    color: '[rgb string]',
    tagging_enabled: 1,
    scope: 'adventure',
    layout: {
      searchable_columns: ['name', 'summary', 'description'],
      columns: [
        {
          key: 'image_id',
          label: 'Avatar',
          sortable: false,
          resizable: false,
          width: 136,
        },
        { key: 'name', label: 'Name', width: 250 },
        { key: 'created_at', label: 'Created At', width: 250 },
        { key: 'updated_at', label: 'Last updated', width: 250 },
      ],
      sort_state: { column: 'updated_at', direction: 'desc' },
    },
  };

  const up = async (db: Database): Promise<void> => {
    const id = generateId();
    const { created_at, updated_at } = generateDbTimestamps();
    const layout = JSON.stringify(config.layout);

    await db.execute(
      `INSERT INTO table_config
         (id, table_name, color, layout, tagging_enabled, scope, created_at, updated_at)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8
       WHERE NOT EXISTS (SELECT 1 FROM table_config WHERE table_name = $2)`,
      [
        id,
        config.table_name,
        config.color,
        layout,
        config.tagging_enabled,
        config.scope,
        created_at,
        updated_at,
      ],
    );
  };

  export const add[Plural]TableConfigMigration = {
    id: '[timestamp]',
    up,
  };
  ```

  Add the migration to the `migrations` array in `db/_migrations/index.ts`, as the last
  element — `migrationHead` is read as `migrations[migrations.length - 1].id` and must
  remain the highest id. No change to `db/_sync/registry.ts` — the new type shares
  `base_entities`'s existing `syncedTable` entry.

### Services

Needs no change — `services/baseEntityService.ts` already accepts any `BaseEntityType`.

### Data Access Layer

- Add a `prefetchBaseEntity('[plural]')` entry to
  `data-access-layer/mentions/mentionPrefetchByType.ts`'s map — `tsc` rejects the map
  literal until every `BaseEntityType` member (and every other `MentionEntityType` member)
  has an entry, so this is required, not optional.

### Frontend

- The two route files, in the shapes `src/routes/adventure.$adventureId.[plural].tsx` and
  `src/routes/adventure.$adventureId.[singular].$baseEntityId.tsx` — see the List Route and
  Detail Route shapes under Routes below.
- Two cases in `src/components/Header/helper/buildBreadcrumbs.ts`'s switch (list and
  detail), and their assertions in `buildBreadcrumbs.test.ts`.
- One label added to the existing grouped case in
  `screens/components/ScreensDuplicateBtn/ScreensDuplicateBtn.tsx`'s switch and in
  `src/components/Header/components/BreadcrumbList/components/BreadcrumbListEntry.tsx`'s
  switch — both already dispatch every base entity type through one shared body, so adding
  a type means adding its case label to the existing `case 'npcs': case 'pcs': ...` group,
  not writing a new branch.
- One `ScreenNavBtn` entry in `src/components/SideBarNav/SideBarNav.tsx`'s adventure-scoped
  button group.
- One `useBaseEntities('[plural]', adventureId)` call and one `statsMap` entry in
  `AdventureStats.tsx`.

**Needs no change** — `MentionPopupContent.tsx` (dispatches every base entity type through
`isBaseEntityType`), `BaseEntitiesScreen`, `BaseEntityScreen`, `BaseEntitySidebar`,
`BaseEntityPopupContent`, `BaseEntityDuplicateBtn`, `BaseEntityCrumb`,
`services/baseEntityService.ts`, and every `db/base-entity/` CRUD file — all already accept
any `BaseEntityType` as their first argument or prop.

### Routes

**List route** (`adventure.$adventureId.[plural].tsx`, shown for `'npcs'`):

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { BaseEntitiesScreen } from '@/screens';
import {
  baseEntityListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/npcs')({
  component: () => <BaseEntitiesScreen entityType='npcs' />,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        baseEntityListQueryOptions('npcs', params.adventureId),
      ),
      context.queryClient.ensureQueryData(tableConfigListQueryOptions()),
    ]);
  },
});
```

**Detail route** (`adventure.$adventureId.[singular].$baseEntityId.tsx`, shown for
`'npcs'`):

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { BaseEntityScreen } from '@/screens';
import {
  baseEntityQueryOptions,
  ensureImagePainted,
} from '@/data-access-layer';

export const Route = createFileRoute(
  '/adventure/$adventureId/npc/$baseEntityId',
)({
  component: () => <BaseEntityScreen entityType='npcs' />,
  loader: async ({ context, params }) => {
    const baseEntity = await context.queryClient.ensureQueryData(
      baseEntityQueryOptions('npcs', params.baseEntityId),
    );
    await ensureImagePainted(context.queryClient, baseEntity.image_id);
  },
});
```

The inline `component` arrow is route configuration, not an inline sub-component — it
supplies the static `entityType` prop the route file alone knows, since `entityType` is not
a URL param.

After creating these files, run `pnpm run build:frontend` once from `app/` — see
Implementation Notes above.

## Detail Screen Composition

`screens/base-entity/BaseEntityScreen.tsx` composes `ScreensTextEditorLayout`: the sidebar
slot renders `<BaseEntitySidebar entityType={entityType} />`, the header slot renders the
summary rich-text editor inside `ScreensSummary`, and the body slot renders the name input
followed by the description editor. This is the reference implementation for that
composition pattern.

**`screens/session/` and `screens/encounter/` are deliberate exceptions** to this
composition — each for its own reason, and neither is a template to copy:

- `screens/session/`: its hand-rolled `SessionHeader` re-implements what `ScreensNameInput`
  now provides, and its custom `SessionScreen.css` layout predates the shared components
  below. This shape must not be copied.
- `screens/encounter/`: `EncounterScreen` bypasses `ScreensTextEditorLayout` because
  Encounter has no summary field — its custom `EncounterScreen.css` (GlassPanel root,
  header above a body grid) is a deliberately minimal base for a future encounter-specific
  screen. Unlike `SessionHeader`, `EncounterHeader` composes the shared `ScreensNameInput`
  rather than hand-rolling it — only the screen-level layout deviates, not the header's
  internals. Do not copy this shape either; it's justified by Encounter's specific lack of
  a summary field, not a new default pattern.

## Customization Points

Resolve these at spec-generation time. Provide them in the `/write-specs` prompt.

| Point | Default | Where used |
| --- | --- | --- |
| Summary template lines | None — must specify | `db/base-entity/create.ts` |
| Table config color | None — must specify | the new `table_config`-seeding migration |
| `tagging_enabled` | `1` | the new `table_config`-seeding migration |
| `scope` | `'adventure'` | the new `table_config`-seeding migration |
| Display label | None — must specify | `domain/entities/entityTypeLabels.ts` |
| Search hint word | None — must specify | `domain/entities/baseEntitySearchHints.ts` |
