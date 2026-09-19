// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDateTimeString } from '@util';

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

  it('returns the requested encounter when several are stored', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create } = await import('../create');
    const { get } = await import('../get');
    const adventureId = await createAdventure();
    await create(adventureId);
    vi.setSystemTime(new Date(SECOND_CREATED_AT));
    const secondId = await create(adventureId);

    expect(await get(secondId)).toEqual({
      id: secondId,
      adventure_id: adventureId,
      name: `New Encounter ${getDateTimeString(SECOND_CREATED_AT)}`,
      description: null,
      pinned_order: null,
      created_at: SECOND_CREATED_AT,
      updated_at: SECOND_CREATED_AT,
    });
  });

  it('returns null for an id with no encounter', async () => {
    const { get } = await import('../get');

    expect(await get('missing-encounter')).toBeNull();
  });
});
