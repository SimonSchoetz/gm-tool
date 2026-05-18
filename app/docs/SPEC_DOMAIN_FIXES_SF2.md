# SF2 — Make `name` Nullable

Remove `NOT NULL` from `npcs.name` and `adventures.name`; run a one-shot migration against the existing database; fix downstream TypeScript errors caused by the type widening.

Do SF2 before SF6. Both touch `NpcSidebar.tsx` and `AdventureScreenSidebar.tsx` at different locations — completing SF2 first avoids merge friction.

## Files Affected

Modified:
- `app/db/npc/schema.ts`
- `app/db/adventure/schema.ts`
- `app/db/database.ts`
- `app/src/screens/npc/components/NpcSidebar/NpcSidebar.tsx`
- `app/src/screens/adventure/components/AdventureScreenSidebar/AdventureScreenSidebar.tsx`
- `app/src/screens/adventures/components/ToAdventureBtn/ToAdventureBtn.tsx`

## DB Changes

### `app/db/npc/schema.ts`

On the `name` column:
- Remove `notNull: true`
- Change `zod: z.string()` to `zod: z.string().optional()`
- Remove the `updateZod: z.string()` line entirely

After the change the `name` column definition is:

```ts
name: {
  type: 'TEXT',
  zod: z.string().optional(),
},
```

No other column in `npcTable` changes.

### `app/db/adventure/schema.ts`

On the `name` column, apply the same three changes:
- Remove `notNull: true`
- Change `zod: z.string()` to `zod: z.string().optional()`
- Remove `updateZod: z.string()`

After the change the `name` column definition is:

```ts
name: {
  type: 'TEXT',
  zod: z.string().optional(),
},
```

No other column in `adventureTable` changes.

### `app/db/database.ts` — one-shot migration

`database.ts` uses `CREATE TABLE IF NOT EXISTS`, which never modifies an existing table. To apply the nullable-name change to an existing database, add the following migration block inside `initDatabase`, after the table-creation `for` loop and before the `db = database` assignment.

**Delete this entire block after the first app start.**

```ts
// TEMPORARY MIGRATION — delete after first run
await database.execute('PRAGMA foreign_keys = OFF');

await database.execute('DROP TABLE IF EXISTS adventures_migration_temp');
await database.execute(`
  CREATE TABLE adventures_migration_temp (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    image_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
  )
`);
await database.execute(
  'INSERT INTO adventures_migration_temp SELECT * FROM adventures',
);
await database.execute('DROP TABLE adventures');
await database.execute(
  'ALTER TABLE adventures_migration_temp RENAME TO adventures',
);

await database.execute('DROP TABLE IF EXISTS npcs_migration_temp');
await database.execute(`
  CREATE TABLE npcs_migration_temp (
    id TEXT PRIMARY KEY,
    adventure_id TEXT NOT NULL,
    name TEXT,
    summary TEXT,
    description TEXT,
    image_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
  )
`);
await database.execute(
  'INSERT INTO npcs_migration_temp SELECT * FROM npcs',
);
await database.execute('DROP TABLE npcs');
await database.execute('ALTER TABLE npcs_migration_temp RENAME TO npcs');

await database.execute('PRAGMA foreign_keys = ON');
// END TEMPORARY MIGRATION
```

Place this block immediately after the closing brace of the `for` loop, before `db = database;`. The `PRAGMA foreign_keys = OFF` is required to drop the `adventures` table while `sessions` and `npcs` still reference it. FK integrity is fully restored after the migration by `PRAGMA foreign_keys = ON`.

Adventures is migrated before npcs because npcs holds a FK to adventures — recreating adventures first ensures the FK constraint is valid when npcs is recreated.

## Type Propagation Fixes (Frontend)

Changing `name` to `z.string().optional()` widens `Npc.name` and `Adventure.name` from `string` to `string | undefined`. Three screen files pass these fields directly to props or parameters typed as required `string`. Fix each with a `?? ''` fallback.

### `app/src/screens/npc/components/NpcSidebar/NpcSidebar.tsx`

Two callsites need `?? ''`:

1. `UploadImgBtn` — `title` prop (`title?: string`; with `exactOptionalPropertyTypes`, passing `string | undefined` explicitly is a type error):

   Change `title={npc.name}` to `title={npc.name ?? ''}`

2. `openDeleteDialog` — `name` field (`DeleteDialog.name: string`, required):

   Change `name: npc.name` to `name: npc.name ?? ''`

No other changes to this file in this sub-feature.

### `app/src/screens/adventure/components/AdventureScreenSidebar/AdventureScreenSidebar.tsx`

One callsite:

- `openDeleteDialog` — `name` field (`DeleteDialog.name: string`, required):

  Change `name: adventure.name` to `name: adventure.name ?? ''`

No other changes to this file in this sub-feature.

### `app/src/screens/adventures/components/ToAdventureBtn/ToAdventureBtn.tsx`

Two callsites:

1. `HoloImg` — `title` prop (`HoloImg.title: string`, required):

   Change `title={adventure.name}` to `title={adventure.name ?? ''}`

2. `Link` — `aria-label` attribute. React types `aria-label` as `string | undefined` in `AriaAttributes`, so passing `string | undefined` is valid here. No change needed.

## Services, DAL

No changes in this sub-feature.
