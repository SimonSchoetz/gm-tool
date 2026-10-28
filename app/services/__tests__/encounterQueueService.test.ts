import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as queueItemDb from '@db/encounter-queue-item';
import type * as logEntryDb from '@db/encounter-log-entry';
import type * as baseEntityDb from '@db/base-entity';
import type * as sectionDb from '@db/base-entity-content-section';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import {
  patchBasicStatBlockContent,
  patchFiveEStatBlockContent,
} from '@domain';

const getAllByEncounter = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.getAllByEncounter>(),
);
const createMany = vi.hoisted(() => vi.fn<typeof queueItemDb.createMany>());
const update = vi.hoisted(() => vi.fn<typeof queueItemDb.update>());
const createLogEntry = vi.hoisted(() => vi.fn<typeof logEntryDb.create>());
const getBaseEntity = vi.hoisted(() => vi.fn<typeof baseEntityDb.get>());
const getAllByBaseEntity = vi.hoisted(() =>
  vi.fn<typeof sectionDb.getAllByBaseEntity>(),
);

vi.mock('@db/encounter-queue-item', () => ({
  getAllByEncounter,
  createMany,
  update,
}));
vi.mock('@db/encounter-log-entry', () => ({ create: createLogEntry }));
vi.mock('@db/base-entity', () => ({ get: getBaseEntity }));
vi.mock('@db/base-entity-content-section', () => ({ getAllByBaseEntity }));

const ENCOUNTER_ID = 'encounter-1';
const ENTITY_ID = 'goblin';

const queueItem = (
  overrides: Partial<EncounterQueueItem>,
): EncounterQueueItem => ({
  id: 'item',
  encounter_id: ENCOUNTER_ID,
  kind: 'combatant',
  base_entity_id: ENTITY_ID,
  name: null,
  custom_name: null,
  notes: null,
  sequence_number: 1,
  starting_max_hp: null,
  sort_order: 0,
  created_at: '',
  updated_at: '',
  ...overrides,
});

const baseEntity = (name: string | null): BaseEntity => ({
  id: ENTITY_ID,
  adventure_id: 'adventure-1',
  entity_type: 'foes',
  name,
  description: null,
  image_id: null,
  pinned_order: null,
  created_at: '',
  updated_at: '',
});

const section = (
  type: BaseEntityContentSection['type'],
  content: string | null,
): BaseEntityContentSection => ({
  id: `section-${type}`,
  base_entity_id: ENTITY_ID,
  name: null,
  type,
  content,
  checked: 0,
  sort_order: 0,
  created_at: '',
  updated_at: '',
});

const arrange = ({
  existing = [],
  entity = baseEntity('Goblin'),
  sections = [],
}: {
  existing?: EncounterQueueItem[];
  entity?: BaseEntity | null;
  sections?: BaseEntityContentSection[];
} = {}) => {
  getAllByEncounter.mockResolvedValue(existing);
  getBaseEntity.mockResolvedValue(entity);
  getAllByBaseEntity.mockResolvedValue(sections);
};

const createdRows = () => createMany.mock.calls[0][0];

describe('addEntityCombatants', () => {
  beforeEach(() => {
    vi.resetModules();
    getAllByEncounter.mockReset();
    createMany
      .mockReset()
      .mockImplementation((rows) =>
        Promise.resolve(rows.map((_, index) => `new-${index}`)),
      );
    update.mockReset().mockResolvedValue();
    createLogEntry.mockReset().mockResolvedValue('log-1');
    getBaseEntity.mockReset();
    getAllByBaseEntity.mockReset();
  });

  it('continues sort_order after the highest existing value, with a gap in the existing values', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({
      existing: [
        queueItem({ id: 'a', sort_order: 0 }),
        queueItem({ id: 'b', sort_order: 5 }),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 2);

    expect(createdRows().map((row) => row.sort_order)).toEqual([6, 7]);
  });

  it('starts sort_order at 0 on an empty queue', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange();

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 2);

    expect(createdRows().map((row) => row.sort_order)).toEqual([0, 1]);
  });

  it('continues numbering after the highest sequence_number of the same entity, with a gap, ignoring another entity', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({
      existing: [
        queueItem({ id: 'a', sequence_number: 1, sort_order: 0 }),
        queueItem({ id: 'b', sequence_number: 3, sort_order: 1 }),
        queueItem({
          id: 'c',
          base_entity_id: 'other',
          sequence_number: 9,
          sort_order: 2,
        }),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 2);

    expect(createdRows().map((row) => row.sequence_number)).toEqual([4, 5]);
  });

  it('starts numbering at 1 when the entity has no combatant yet', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({
      existing: [
        queueItem({ id: 'c', base_entity_id: 'other', sequence_number: 9 }),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 1);

    expect(createdRows().map((row) => row.sequence_number)).toEqual([1]);
  });

  it('writes all rows in one createMany call carrying the single stat block HP and the entity name', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({
      sections: [
        section(
          'basic-stat-block',
          patchBasicStatBlockContent(null, { hp: 7 }),
        ),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 3);

    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createdRows()).toHaveLength(3);
    for (const row of createdRows()) {
      expect(row).toMatchObject({
        encounter_id: ENCOUNTER_ID,
        kind: 'combatant',
        base_entity_id: ENTITY_ID,
        name: 'Goblin',
        starting_max_hp: 7,
      });
    }
  });

  it('keeps a stat block HP of 0', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({
      sections: [
        section('5e-stat-block', patchFiveEStatBlockContent(null, 'hp', 0)),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 1);

    expect(createdRows()[0].starting_max_hp).toBe(0);
  });

  it.each([
    ['no stat block', []],
    [
      'two stat blocks',
      [
        section(
          'basic-stat-block',
          patchBasicStatBlockContent(null, { hp: 7 }),
        ),
        section(
          'basic-stat-block',
          patchBasicStatBlockContent(null, { hp: 8 }),
        ),
      ],
    ],
    [
      'an empty HP',
      [
        section(
          'basic-stat-block',
          patchBasicStatBlockContent(null, { hp: null }),
        ),
      ],
    ],
  ])('leaves starting_max_hp out of the rows for %s', async (_, sections) => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({ sections });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 1);

    expect('starting_max_hp' in createdRows()[0]).toBe(false);
  });

  it('leaves the name out of the rows for an unnamed entity', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({ entity: baseEntity(null) });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 1);

    expect('name' in createdRows()[0]).toBe(false);
  });

  it('writes the added entry after the insert with the ids createMany returned, in order', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange();
    createMany.mockResolvedValue(['x', 'y']);

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 2);

    expect(createLogEntry).toHaveBeenCalledWith({
      encounter_id: ENCOUNTER_ID,
      kind: 'added',
      payload: { queueItemIds: ['x', 'y'] },
    });
    expect(createMany.mock.invocationCallOrder[0]).toBeLessThan(
      createLogEntry.mock.invocationCallOrder[0],
    );
  });

  it('writes no added entry and rejects as EncounterQueueAddError when createMany rejects', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange();
    createMany.mockRejectedValue(new Error('disk full'));

    await expect(
      addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 1),
    ).rejects.toMatchObject({ name: 'EncounterQueueAddError' });
    expect(createLogEntry).not.toHaveBeenCalled();
  });

  it.each([0, 100, 1.5])(
    'rejects quantity %s as EncounterQueueAddError before any db call',
    async (quantity) => {
      const { addEntityCombatants } = await import('../encounterQueueService');
      arrange();

      await expect(
        addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, quantity),
      ).rejects.toThrow(
        new RegExp(
          `^Failed to add combatants to the encounter queue: Error: Invalid quantity: ${quantity}$`,
        ),
      );
      expect(getBaseEntity).not.toHaveBeenCalled();
      expect(getAllByEncounter).not.toHaveBeenCalled();
      expect(createMany).not.toHaveBeenCalled();
    },
  );

  it('rejects an entity that does not exist without any write', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({ entity: null });

    await expect(
      addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID, 1),
    ).rejects.toThrow(
      /^Failed to add combatants to the encounter queue: BaseEntityNotFoundError: Foe with id goblin not found$/,
    );
    expect(createMany).not.toHaveBeenCalled();
    expect(createLogEntry).not.toHaveBeenCalled();
  });
});

describe('getQueueItems', () => {
  beforeEach(() => {
    getAllByEncounter.mockReset();
  });

  it('returns the encounter’s queue items', async () => {
    const { getQueueItems } = await import('../encounterQueueService');
    const items = [queueItem({ id: 'a' })];
    getAllByEncounter.mockResolvedValue(items);

    expect(await getQueueItems(ENCOUNTER_ID)).toBe(items);
    expect(getAllByEncounter).toHaveBeenCalledWith(ENCOUNTER_ID);
  });

  it('rejects as EncounterQueueLoadError when the read fails', async () => {
    const { getQueueItems } = await import('../encounterQueueService');
    getAllByEncounter.mockRejectedValue(new Error('locked'));

    await expect(getQueueItems(ENCOUNTER_ID)).rejects.toMatchObject({
      name: 'EncounterQueueLoadError',
    });
  });
});

describe('reorderQueueItems', () => {
  beforeEach(() => {
    update.mockReset().mockResolvedValue();
  });

  it('updates each id with its array index as sort_order, in array order', async () => {
    const { reorderQueueItems } = await import('../encounterQueueService');

    await reorderQueueItems(['c', 'a', 'b']);

    expect(update.mock.calls).toEqual([
      ['c', { sort_order: 0 }],
      ['a', { sort_order: 1 }],
      ['b', { sort_order: 2 }],
    ]);
  });

  it('rejects as EncounterQueueReorderError when an update fails', async () => {
    const { reorderQueueItems } = await import('../encounterQueueService');
    update.mockRejectedValue(new Error('locked'));

    await expect(reorderQueueItems(['a'])).rejects.toMatchObject({
      name: 'EncounterQueueReorderError',
    });
  });
});
