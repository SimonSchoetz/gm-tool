# SF1 — Fix `remove.ts` Validation

Replace inline ID guards with `assertValidId` in all DB domain `remove.ts` files that do not already use it.

## Files Affected

Modified:
- `app/db/npc/remove.ts`
- `app/db/adventure/remove.ts`
- `app/db/session/remove.ts`
- `app/db/image/remove.ts`

## DB Changes

### `app/db/npc/remove.ts`

Add `assertValidId` to the import from `'../util'`. Replace the entire `if (!id || typeof id !== 'string' || id.trim() === '')` block and its thrown error with:

```ts
assertValidId(id, 'NPC');
```

Final file:

```ts
import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'NPC');
  const db = await getDatabase();
  await db.execute('DELETE FROM npcs WHERE id = $1', [id]);
};
```

### `app/db/adventure/remove.ts`

Same change. Replace the inline guard with `assertValidId(id, 'adventure')`. Add `assertValidId` to the import from `'../util'`.

Final file:

```ts
import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'adventure');
  const db = await getDatabase();
  await db.execute('DELETE FROM adventures WHERE id = $1', [id]);
};
```

### `app/db/session/remove.ts`

Same change. Replace the inline guard with `assertValidId(id, 'session')`. Add `assertValidId` to the import from `'../util'`.

Final file:

```ts
import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'session');
  const db = await getDatabase();
  await db.execute('DELETE FROM sessions WHERE id = $1', [id]);
};
```

### `app/db/image/remove.ts`

`image/remove.ts` has a three-step operation (lookup, DB delete, file delete) and uses a weaker `if (!id)` guard. Replace only the guard. The rest of the function body stays unchanged.

Change the `if (!id)` block to:

```ts
assertValidId(id, 'image');
```

Add `assertValidId` to the import from `'../util'`. Remove the comment lines (they describe what the code does, not why). The `// Get the image record...`, `// Delete from database`, and `// Delete the actual file...` comments are all WHAT-comments and must be removed per CLAUDE.md.

Final file:

```ts
import { invoke } from '@tauri-apps/api/core';
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import { get } from './get';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'image');

  const image = await get(id);

  const db = await getDatabase();
  await db.execute('DELETE FROM images WHERE id = $1', [id]);

  if (image) {
    await invoke('delete_image', {
      id,
      extension: image.file_extension,
    });
  }
};
```

## Services, DAL, Frontend

No changes.
