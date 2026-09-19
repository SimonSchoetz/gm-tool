// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Encounter, UpdateEncounterInput } from '../types';

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

const createEncounter = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('../create');
  return create(await createAdventure());
};

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(T1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the description with a new updated_at', async () => {
    const { update } = await import('../update');
    const id = await createEncounter();
    const before = await readEncounter(id);
    vi.setSystemTime(new Date(T2));

    await update(id, { description: 'A goblin ambush' });

    expect(await readEncounter(id)).toEqual({
      ...before,
      description: 'A goblin ambush',
      updated_at: T2,
    });
  });

  it('clears name and description when they are set to null', async () => {
    const { update } = await import('../update');
    const id = await createEncounter();
    await update(id, { description: 'to clear' });
    expect(await readEncounter(id)).toMatchObject({
      description: 'to clear',
      name: expect.any(String) as string,
    });

    await update(id, { name: null, description: null });

    expect(await readEncounter(id)).toMatchObject({
      name: null,
      description: null,
    });
  });

  it('rejects a numeric description and leaves the row unchanged', async () => {
    const { update } = await import('../update');
    const id = await createEncounter();
    const before = await readEncounter(id);

    await expect(
      update(id, { description: 5 } as unknown as UpdateEncounterInput),
    ).rejects.toThrow();

    expect(await readEncounter(id)).toEqual(before);
  });
});
