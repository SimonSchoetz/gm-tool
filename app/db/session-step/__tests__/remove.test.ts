// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('remove', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("removes only the given step and leaves the session's other step", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createSession } = await import('@db/session');
    const { create } = await import('../create');
    const { remove } = await import('../remove');
    const { getAllBySession } = await import('../get-all-by-session');
    const sessionId = await createSession(await createAdventure());
    const removedId = await create({ session_id: sessionId, sort_order: 0 });
    const keptId = await create({ session_id: sessionId, sort_order: 1 });

    await remove(removedId);

    expect((await getAllBySession(sessionId)).map((step) => step.id)).toEqual([
      keptId,
    ]);
  });
});
