// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const T1 = '2026-01-10T09:00:00.000Z';
const T2 = '2026-01-11T09:00:00.000Z';

const readSession = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<Session[]>(
    'SELECT * FROM sessions WHERE id = $1',
    [id],
  );
  return rows[0];
};

// Every column the duplicate copies or resets holds a non-default value on the source.
const seedSourceSession = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('../create');
  const { update } = await import('../update');
  const { setPinnedOrder } = await import('@db/pinned-order');
  const adventureId = await createAdventure();
  const sourceId = await create(adventureId);
  await update(sourceId, {
    name: 'n',
    description: 'd',
    summary: 's',
    session_date: '2026-01-01',
    active_view: 'ingame',
  });
  await setPinnedOrder('sessions', sourceId, 3);
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

  it('creates a new session of the same adventure that keeps what a copy should keep and resets the rest', async () => {
    const { duplicate } = await import('../duplicate');
    const { adventureId, sourceId } = await seedSourceSession();
    vi.setSystemTime(new Date(T2));

    const duplicateId = await duplicate(sourceId);

    expect(duplicateId).not.toBe(sourceId);
    expect(await readSession(duplicateId)).toEqual({
      id: duplicateId,
      name: null,
      description: 'd',
      summary: 's',
      session_date: '2026-01-01',
      active_view: 'ingame',
      adventure_id: adventureId,
      pinned_order: null,
      created_at: T2,
      updated_at: T2,
    });
  });

  it('leaves the source session unchanged, timestamps included', async () => {
    const { duplicate } = await import('../duplicate');
    const { sourceId } = await seedSourceSession();
    const before = await readSession(sourceId);
    vi.setSystemTime(new Date(T2));

    await duplicate(sourceId);

    expect(await readSession(sourceId)).toEqual(before);
  });

  it('rejects an unknown source id', async () => {
    const { duplicate } = await import('../duplicate');

    await expect(duplicate('missing-session')).rejects.toThrow(
      'Session not found: missing-session',
    );
  });
});
