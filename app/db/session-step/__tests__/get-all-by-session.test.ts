// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getAllBySession', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns only the session's steps in ascending sort order", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createSession } = await import('@db/session');
    const { create } = await import('../create');
    const { getAllBySession } = await import('../get-all-by-session');
    const adventureId = await createAdventure();
    const sessionId = await createSession(adventureId);
    const otherSessionId = await createSession(adventureId);
    // Inserted out of sort order, so insertion order and sort order differ.
    const thirdId = await create({ session_id: sessionId, sort_order: 2 });
    const firstId = await create({ session_id: sessionId, sort_order: 0 });
    const secondId = await create({ session_id: sessionId, sort_order: 1 });
    await create({ session_id: otherSessionId, sort_order: 0 });

    const steps = await getAllBySession(sessionId);

    expect(steps.map((step) => step.id)).toEqual([firstId, secondId, thirdId]);
  });
});
