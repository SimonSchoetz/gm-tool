// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const seedAdventureWithChildren = async () => {
  const { create: createAdventure } = await import('../create');
  const { create: createSession } = await import('@db/session');
  const { create: createSessionStep } = await import('@db/session-step');
  const { create: createEncounter } = await import('@db/encounter');
  const { create: createBaseEntity } = await import('@db/base-entity');
  const { create: createSection } =
    await import('@db/base-entity-content-section');
  const id = await createAdventure();
  const sessionId = await createSession(id);
  await createSessionStep({ session_id: sessionId, sort_order: 0 });
  await createEncounter(id);
  const baseEntityId = await createBaseEntity('npcs', id);
  await createSection({
    base_entity_id: baseEntityId,
    type: 'text',
    sort_order: 0,
  });
  return id;
};

const countChildRows = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const counts: Record<string, number> = {};
  for (const table of [
    'sessions',
    'session_steps',
    'encounters',
    'base_entities',
    'base_entity_content_sections',
  ]) {
    const [row] = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM ${table}`,
    );
    counts[table] = row.count;
  }
  return counts;
};

describe('remove', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('deletes the adventure together with its sessions, steps, encounters, base entities and content sections', async () => {
    const { remove } = await import('../remove');
    const { getAll } = await import('../get-all');
    const adventureId = await seedAdventureWithChildren();

    await remove(adventureId);

    expect(await getAll()).toEqual([]);
    expect(await countChildRows()).toEqual({
      sessions: 0,
      session_steps: 0,
      encounters: 0,
      base_entities: 0,
      base_entity_content_sections: 0,
    });
  });

  it('leaves a second adventure and its children untouched', async () => {
    const { remove } = await import('../remove');
    const { getAll } = await import('../get-all');
    const removedId = await seedAdventureWithChildren();
    const keptId = await seedAdventureWithChildren();

    await remove(removedId);

    expect((await getAll()).map((adventure) => adventure.id)).toEqual([keptId]);
    expect(await countChildRows()).toEqual({
      sessions: 1,
      session_steps: 1,
      encounters: 1,
      base_entities: 1,
      base_entity_content_sections: 1,
    });
  });
});
