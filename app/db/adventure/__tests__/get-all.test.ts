// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getAll', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns every adventure, the most recently created first', async () => {
    const { create } = await import('../create');
    const { getAll } = await import('../get-all');
    // Created out of order, so insertion order and creation order differ.
    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'));
    const latestId = await create();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const oldestId = await create();
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
    const middleId = await create();

    const adventures = await getAll();

    expect(adventures.map((adventure) => adventure.id)).toEqual([
      latestId,
      middleId,
      oldestId,
    ]);
  });
});
