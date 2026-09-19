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

  it('returns the requested adventure when several are stored', async () => {
    const { create } = await import('../create');
    const { update } = await import('../update');
    const { get } = await import('../get');
    await create();
    vi.setSystemTime(new Date(SECOND_CREATED_AT));
    const secondId = await create();
    await update(secondId, {
      name: 'Second adventure',
      description: 'Second description',
    });

    expect(await get(secondId)).toEqual({
      id: secondId,
      name: 'Second adventure',
      description: 'Second description',
      image_id: null,
      created_at: SECOND_CREATED_AT,
      updated_at: SECOND_CREATED_AT,
    });
  });

  it('returns null for an id with no adventure', async () => {
    const { get } = await import('../get');

    expect(await get('missing-adventure')).toBeNull();
  });
});
