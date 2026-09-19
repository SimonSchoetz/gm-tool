// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

describe('getRowById', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the full row of the requested adventure when several are stored, and null for an unknown id', async () => {
    const { create, update } = await import('@db/adventure');
    const { getRowById } = await import('../get-row-by-id');
    await create();
    const secondId = await create();
    await update(secondId, {
      name: 'Second adventure',
      description: 'Second description',
    });

    expect(await getRowById('adventures', secondId)).toEqual({
      id: secondId,
      name: 'Second adventure',
      description: 'Second description',
      image_id: null,
      created_at: CREATED_AT,
      updated_at: CREATED_AT,
    });
    expect(await getRowById('adventures', 'missing-adventure')).toBeNull();
  });

  it('rejects a table missing from the sync registry', async () => {
    const { getRowById } = await import('../get-row-by-id');

    await expect(getRowById('paired_devices', 'any-id')).rejects.toThrow(
      /^Unknown synced table/,
    );
  });
});
