// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDateTimeString } from '@util';
import type { Encounter } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readEncounters = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<Encounter[]>('SELECT * FROM encounters');
};

describe('create', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores a named encounter for the adventure with no description', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create } = await import('../create');
    const adventureId = await createAdventure();

    const id = await create(adventureId);

    expect(await readEncounters()).toEqual([
      {
        id,
        adventure_id: adventureId,
        name: `New Encounter ${getDateTimeString(CREATED_AT)}`,
        description: null,
        pinned_order: null,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });

  it('rejects an adventure id with no adventure and stores nothing', async () => {
    const { create } = await import('../create');

    await expect(create('missing-adventure')).rejects.toThrow(
      'FOREIGN KEY constraint failed',
    );

    expect(await readEncounters()).toEqual([]);
  });
});
