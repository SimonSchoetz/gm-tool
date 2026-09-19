// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDateTimeString } from '@util';
import type { Adventure } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

describe('create', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores a named adventure without description or image and returns its id', async () => {
    const { create } = await import('../create');
    const { getDatabase } = await import('@db/database');

    const id = await create();

    const db = await getDatabase();
    expect(await db.select<Adventure[]>('SELECT * FROM adventures')).toEqual([
      {
        id,
        name: `New adventure ${getDateTimeString(CREATED_AT)}`,
        description: null,
        image_id: null,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });
});
