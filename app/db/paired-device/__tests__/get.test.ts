// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';
const DEVICE_A = 'a'.repeat(64);
const DEVICE_B = 'b'.repeat(64);
const UNKNOWN_DEVICE = 'c'.repeat(64);

describe('get', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the device whose id is passed when several are stored, and null for an unknown id', async () => {
    const { create } = await import('../create');
    const { get } = await import('../get');
    await create({ id: DEVICE_A, name: 'Laptop' });
    await create({ id: DEVICE_B, name: 'Desktop' });

    expect(await get(DEVICE_B)).toEqual({
      id: DEVICE_B,
      name: 'Desktop',
      created_at: CREATED_AT,
      updated_at: CREATED_AT,
    });
    expect(await get(UNKNOWN_DEVICE)).toBeNull();
  });
});
