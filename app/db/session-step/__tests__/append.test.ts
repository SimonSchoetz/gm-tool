// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionStep } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readStep = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<SessionStep[]>(
    'SELECT * FROM session_steps WHERE id = $1',
    [id],
  );
  return rows[0];
};

const createSession = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('@db/session');
  return create(await createAdventure());
};

describe('append', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores the first step of a session at sort order 0, with no name and no default step key', async () => {
    const { append } = await import('../append');
    const sessionId = await createSession();

    const id = await append({ session_id: sessionId });

    expect(await readStep(id)).toMatchObject({
      session_id: sessionId,
      sort_order: 0,
      name: null,
      default_step_key: null,
      created_at: CREATED_AT,
      updated_at: CREATED_AT,
    });
  });

  it('places a step one past the highest sort order of its own session, whatever another session holds, and stores its name', async () => {
    const { append } = await import('../append');
    const { create } = await import('../create');
    const sessionId = await createSession();
    const otherSessionId = await createSession();
    await create({ session_id: sessionId, sort_order: 4 });
    await create({ session_id: sessionId, sort_order: 1 });
    await create({ session_id: otherSessionId, sort_order: 9 });

    const id = await append({ session_id: sessionId, name: 'Notes' });

    expect(await readStep(id)).toMatchObject({ sort_order: 5, name: 'Notes' });
  });
});

describe('append input guards', () => {
  it('rejects a blank session id, naming session in its message', async () => {
    const { append } = await import('../append');

    await expect(append({ session_id: '' })).rejects.toThrow(
      /^Valid session ID is required$/,
    );
  });
});
