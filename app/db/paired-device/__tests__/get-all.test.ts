// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const LATEST_DEVICE = 'a'.repeat(64);
const OLDEST_DEVICE = 'b'.repeat(64);
const MIDDLE_DEVICE = 'c'.repeat(64);

describe('getAll', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns every device, the most recently created first', async () => {
    const { create } = await import('../create');
    const { getAll } = await import('../get-all');
    // Created out of order, so insertion order and creation order differ.
    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'));
    await create({ id: LATEST_DEVICE, name: null });
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    await create({ id: OLDEST_DEVICE, name: null });
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
    await create({ id: MIDDLE_DEVICE, name: null });

    const devices = await getAll();

    expect(devices.map((device) => device.id)).toEqual([
      LATEST_DEVICE,
      MIDDLE_DEVICE,
      OLDEST_DEVICE,
    ]);
  });
});
