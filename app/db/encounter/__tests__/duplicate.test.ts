// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Encounter } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const T1 = '2026-01-10T09:00:00.000Z';
const T2 = '2026-01-11T09:00:00.000Z';

const readEncounter = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<Encounter[]>(
    'SELECT * FROM encounters WHERE id = $1',
    [id],
  );
  return rows[0];
};

// The source holds a name, a description and a pin, so a copy of a column the duplicate must reset shows.
const seedSourceEncounter = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('../create');
  const { update } = await import('../update');
  const { setPinnedOrder } = await import('@db/pinned-order');
  const adventureId = await createAdventure();
  const sourceId = await create(adventureId);
  await update(sourceId, { description: 'd' });
  await setPinnedOrder('encounters', sourceId, 2);
  return { adventureId, sourceId };
};

describe('duplicate', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(T1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a new encounter of the same adventure that keeps the description and resets the name, pin and timestamps', async () => {
    const { duplicate } = await import('../duplicate');
    const { adventureId, sourceId } = await seedSourceEncounter();
    vi.setSystemTime(new Date(T2));

    const duplicateId = await duplicate(sourceId);

    expect(duplicateId).not.toBe(sourceId);
    expect(await readEncounter(duplicateId)).toEqual({
      id: duplicateId,
      adventure_id: adventureId,
      name: null,
      description: 'd',
      pinned_order: null,
      created_at: T2,
      updated_at: T2,
    });
  });

  it('leaves the source encounter unchanged, timestamps included', async () => {
    const { duplicate } = await import('../duplicate');
    const { sourceId } = await seedSourceEncounter();
    const before = await readEncounter(sourceId);
    vi.setSystemTime(new Date(T2));

    await duplicate(sourceId);

    expect(await readEncounter(sourceId)).toEqual(before);
  });

  it('rejects an unknown source id', async () => {
    const { duplicate } = await import('../duplicate');

    await expect(duplicate('missing-encounter')).rejects.toThrow(
      'Encounter not found: missing-encounter',
    );
  });
});
