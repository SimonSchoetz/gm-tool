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

  it("returns only the given adventure's sessions, the most recently created first", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create } = await import('../create');
    const { getAll } = await import('../get-all');
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const adventureId = await createAdventure();
    const otherAdventureId = await createAdventure();
    // Created out of order, so insertion order and creation order differ.
    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'));
    const latestId = await create(adventureId);
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const oldestId = await create(adventureId);
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
    const middleId = await create(adventureId);
    await create(otherAdventureId);

    const sessions = await getAll(adventureId);

    expect(sessions.map((session) => session.id)).toEqual([
      latestId,
      middleId,
      oldestId,
    ]);
  });
});
