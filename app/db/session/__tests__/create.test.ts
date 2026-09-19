// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readSessions = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<Session[]>('SELECT * FROM sessions');
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

  it('stores a session for the adventure in the prep view with no name, description, summary or date', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create } = await import('../create');
    const adventureId = await createAdventure();

    const id = await create(adventureId);

    expect(await readSessions()).toEqual([
      {
        id,
        name: null,
        description: null,
        summary: null,
        session_date: null,
        active_view: 'prep',
        adventure_id: adventureId,
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

    expect(await readSessions()).toEqual([]);
  });
});
