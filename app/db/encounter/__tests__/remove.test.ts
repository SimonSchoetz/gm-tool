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

  it("removes the encounter and leaves the adventure's other encounter", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create } = await import('../create');
    const { remove } = await import('../remove');
    const { getAll } = await import('../get-all');
    const adventureId = await createAdventure();
    const removedId = await create(adventureId);
    const keptId = await create(adventureId);

    await remove(removedId);

    expect(
      (await getAll(adventureId)).map((encounter) => encounter.id),
    ).toEqual([keptId]);
  });
});
