// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session, UpdateSessionInput } from '../types';

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

const createSession = async () => {
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

  it('writes the active view with a new updated_at', async () => {
    const { update } = await import('../update');
    const id = await createSession();
    vi.setSystemTime(new Date(T2));

    await update(id, { active_view: 'ingame' });

    expect(await readSession(id)).toMatchObject({
      active_view: 'ingame',
      created_at: T1,
      updated_at: T2,
    });
  });

  it('clears summary and session_date when they are set to null', async () => {
    const { update } = await import('../update');
    const id = await createSession();
    await update(id, { summary: 'to clear', session_date: '2026-02-02' });
    expect(await readSession(id)).toMatchObject({
      summary: 'to clear',
      session_date: '2026-02-02',
    });

    await update(id, { summary: null, session_date: null });

    expect(await readSession(id)).toMatchObject({
      summary: null,
      session_date: null,
    });
  });

  it('rejects an active view outside the known views and leaves the row unchanged', async () => {
    const { update } = await import('../update');
    const id = await createSession();
    const before = await readSession(id);

    await expect(
      update(id, { active_view: 'bogus' } as unknown as UpdateSessionInput),
    ).rejects.toThrow();

    expect(await readSession(id)).toEqual(before);
  });
});
