// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { EncounterQueueItem } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';
const UPDATED_AT = '2026-01-11T09:00:00.000Z';

const readItem = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<EncounterQueueItem[]>(
    'SELECT * FROM encounter_queue_items WHERE id = $1',
    [id],
  );
  return rows[0];
};

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the sort order and a new updated_at and leaves the other columns and the other rows untouched', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createEncounter } = await import('@db/encounter');
    const { create: createBaseEntity } = await import('@db/base-entity');
    const { createMany } = await import('../create-many');
    const { update } = await import('../update');
    const adventureId = await createAdventure();
    const encounterId = await createEncounter(adventureId);
    const baseEntityId = await createBaseEntity('foes', adventureId);
    const [targetId, otherId] = await createMany(
      [3, 4].map((sort_order) => ({
        encounter_id: encounterId,
        kind: 'combatant' as const,
        base_entity_id: baseEntityId,
        sequence_number: sort_order,
        sort_order,
        name: 'Goblin',
        starting_max_hp: 7,
      })),
    );
    const targetBefore = await readItem(targetId);
    const otherBefore = await readItem(otherId);
    vi.setSystemTime(new Date(UPDATED_AT));

    await update(targetId, { sort_order: 0 });

    expect(await readItem(targetId)).toEqual({
      ...targetBefore,
      sort_order: 0,
      updated_at: UPDATED_AT,
    });
    expect(await readItem(otherId)).toEqual(otherBefore);
  });
});
