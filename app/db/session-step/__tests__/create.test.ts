// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionStep } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readSteps = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<SessionStep[]>('SELECT * FROM session_steps');
};

const createSession = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('@db/session');
  return create(await createAdventure());
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

  it('stores a step created with only a session and a sort order as unchecked with no name, content or step key', async () => {
    const { create } = await import('../create');
    const sessionId = await createSession();

    const id = await create({ session_id: sessionId, sort_order: 3 });

    expect(await readSteps()).toEqual([
      {
        id,
        session_id: sessionId,
        name: null,
        content: null,
        default_step_key: null,
        checked: 0,
        sort_order: 3,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });

  it('stores the step key and the name each in its own column', async () => {
    const { create } = await import('../create');
    const sessionId = await createSession();

    await create({
      session_id: sessionId,
      sort_order: 0,
      default_step_key: 'strong_start',
      name: 'A strong start',
    });

    expect(await readSteps()).toMatchObject([
      {
        name: 'A strong start',
        default_step_key: 'strong_start',
        content: null,
      },
    ]);
  });

  it('rejects a session id with no session and stores nothing', async () => {
    const { create } = await import('../create');

    await expect(
      create({ session_id: 'missing-session', sort_order: 0 }),
    ).rejects.toThrow('FOREIGN KEY constraint failed');

    expect(await readSteps()).toEqual([]);
  });
});
