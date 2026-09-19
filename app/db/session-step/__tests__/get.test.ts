// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const FIRST_CREATED_AT = '2026-01-10T09:00:00.000Z';
const SECOND_CREATED_AT = '2026-01-11T09:00:00.000Z';

describe('get', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(FIRST_CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the requested step when several are stored', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createSession } = await import('@db/session');
    const { create } = await import('../create');
    const { get } = await import('../get');
    const sessionId = await createSession(await createAdventure());
    await create({ session_id: sessionId, sort_order: 0 });
    vi.setSystemTime(new Date(SECOND_CREATED_AT));
    const secondId = await create({ session_id: sessionId, sort_order: 1 });

    expect(await get(secondId)).toEqual({
      id: secondId,
      session_id: sessionId,
      name: null,
      content: null,
      default_step_key: null,
      checked: 0,
      sort_order: 1,
      created_at: SECOND_CREATED_AT,
      updated_at: SECOND_CREATED_AT,
    });
  });

  it('returns null for an id with no step', async () => {
    const { get } = await import('../get');

    expect(await get('missing-step')).toBeNull();
  });
});
