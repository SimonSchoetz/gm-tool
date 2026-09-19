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

  it("deletes the session and its steps and leaves the adventure's other session and its steps", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createSession } = await import('../create');
    const { remove } = await import('../remove');
    const { getAll } = await import('../get-all');
    const { create: createStep } = await import('@db/session-step');
    const { getDatabase } = await import('@db/database');
    const adventureId = await createAdventure();
    const removedId = await createSession(adventureId);
    const keptId = await createSession(adventureId);
    await createStep({ session_id: removedId, sort_order: 0 });
    await createStep({ session_id: keptId, sort_order: 0 });

    await remove(removedId);

    expect((await getAll(adventureId)).map((session) => session.id)).toEqual([
      keptId,
    ]);
    const db = await getDatabase();
    expect(
      await db.select<{ session_id: string }[]>(
        'SELECT session_id FROM session_steps',
      ),
    ).toEqual([{ session_id: keptId }]);
  });
});
