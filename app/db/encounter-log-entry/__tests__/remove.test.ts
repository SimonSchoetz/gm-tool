// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const readEntryIds = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<{ id: string }[]>(
    'SELECT id FROM encounter_log_entries',
  );
  return rows.map((row) => row.id).sort();
};

const createEntries = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createEncounter } = await import('@db/encounter');
  const { create } = await import('../create');
  const encounterId = await createEncounter(await createAdventure());
  const message = await create({
    encounter_id: encounterId,
    kind: 'message',
    payload: { editorState: 'first' },
  });
  const otherMessage = await create({
    encounter_id: encounterId,
    kind: 'message',
    payload: { editorState: 'second' },
  });
  const damage = await create({
    encounter_id: encounterId,
    kind: 'damage',
    payload: { targets: [{ queueItemId: 'a', amount: 3 }] },
  });
  return { message, otherMessage, damage };
};

describe('remove', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('deletes only the named message and keeps the other rows of the encounter', async () => {
    const { remove } = await import('../remove');
    const { message, otherMessage, damage } = await createEntries();

    await remove(message);

    expect(await readEntryIds()).toEqual([otherMessage, damage].sort());
  });

  it('keeps a row of another kind when its id is passed', async () => {
    const { remove } = await import('../remove');
    const { message, otherMessage, damage } = await createEntries();

    await remove(damage);

    expect(await readEntryIds()).toEqual(
      [message, otherMessage, damage].sort(),
    );
  });

  it('rejects an empty id and deletes nothing', async () => {
    const { remove } = await import('../remove');
    const { message, otherMessage, damage } = await createEntries();

    await expect(remove('')).rejects.toThrow(
      /^Valid Log entry ID is required$/,
    );

    expect(await readEntryIds()).toEqual(
      [message, otherMessage, damage].sort(),
    );
  });
});
