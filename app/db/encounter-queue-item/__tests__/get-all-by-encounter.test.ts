// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getAllByEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns only the given encounter's rows, ordered by sort order and then by id", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createEncounter } = await import('@db/encounter');
    const { create: createBaseEntity } = await import('@db/base-entity');
    const { createMany } = await import('../create-many');
    const { getAllByEncounter } = await import('../get-all-by-encounter');
    const adventureId = await createAdventure();
    const encounterId = await createEncounter(adventureId);
    const otherEncounterId = await createEncounter(adventureId);
    const baseEntityId = await createBaseEntity('foes', adventureId);
    const row = (encounter_id: string, sort_order: number) => ({
      encounter_id,
      kind: 'combatant' as const,
      base_entity_id: baseEntityId,
      sequence_number: 1,
      sort_order,
    });

    const [second, firstOfTie, secondOfTie, first] = await createMany([
      row(encounterId, 2),
      row(encounterId, 1),
      row(encounterId, 1),
      row(encounterId, 0),
    ]);
    await createMany([row(otherEncounterId, 0)]);

    const tieByIdOrder = [firstOfTie, secondOfTie].sort();
    expect(
      (await getAllByEncounter(encounterId)).map((item) => item.id),
    ).toEqual([first, ...tieByIdOrder, second]);
  });
});
