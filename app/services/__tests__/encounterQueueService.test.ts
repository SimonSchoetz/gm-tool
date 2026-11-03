import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as queueItemDb from '@db/encounter-queue-item';
import type * as logEntryDb from '@db/encounter-log-entry';
import type * as baseEntityDb from '@db/base-entity';
import type * as sectionDb from '@db/base-entity-content-section';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import {
  ENCOUNTER_ID,
  ENTITY_ID,
  buildBaseEntity,
  buildEncounterLogEntry,
  buildEncounterQueueItem,
  buildSection,
} from './support/encounterQueueFixtures';
import {
  patchBasicStatBlockContent,
  patchFiveEStatBlockContent,
} from '@domain';

const getAllByEncounter = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.getAllByEncounter>(),
);
const createMany = vi.hoisted(() => vi.fn<typeof queueItemDb.createMany>());
const update = vi.hoisted(() => vi.fn<typeof queueItemDb.update>());
const duplicateByEncounter = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.duplicateByEncounter>(),
);
const createLogEntry = vi.hoisted(() => vi.fn<typeof logEntryDb.create>());
const getAllLogEntries = vi.hoisted(() =>
  vi.fn<typeof logEntryDb.getAllByEncounter>(),
);
const getBaseEntity = vi.hoisted(() => vi.fn<typeof baseEntityDb.get>());
const getAllByBaseEntity = vi.hoisted(() =>
  vi.fn<typeof sectionDb.getAllByBaseEntity>(),
);

vi.mock('@db/encounter-queue-item', () => ({
  getAllByEncounter,
  createMany,
  update,
  duplicateByEncounter,
}));
vi.mock('@db/encounter-log-entry', () => ({
  create: createLogEntry,
  getAllByEncounter: getAllLogEntries,
}));
vi.mock('@db/base-entity', () => ({ get: getBaseEntity }));
vi.mock('@db/base-entity-content-section', () => ({ getAllByBaseEntity }));

const arrange = ({
  existing = [],
  entity = buildBaseEntity(),
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
const sharedFields = () => createMany.mock.calls[0][1];

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
        buildEncounterQueueItem({ id: 'a', sort_order: 0 }),
        buildEncounterQueueItem({ id: 'b', sort_order: 5 }),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(createdRows().map((row) => row.sort_order)).toEqual([6]);
  });

  it('starts sort_order at 0 on an empty queue', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange();

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(createdRows().map((row) => row.sort_order)).toEqual([0]);
  });

  it('continues numbering after the highest sequence_number of the same entity, with a gap, ignoring another entity', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({
      existing: [
        buildEncounterQueueItem({ id: 'a', sequence_number: 1, sort_order: 0 }),
        buildEncounterQueueItem({ id: 'b', sequence_number: 3, sort_order: 1 }),
        buildEncounterQueueItem({
          id: 'c',
          base_entity_id: 'other',
          sequence_number: 9,
          sort_order: 2,
        }),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(
      createdRows().map((row) =>
        'sequence_number' in row ? row.sequence_number : null,
      ),
    ).toEqual([4]);
  });

  it('starts numbering at 1 when the entity has no combatant yet', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({
      existing: [
        buildEncounterQueueItem({
          id: 'c',
          base_entity_id: 'other',
          sequence_number: 9,
        }),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(
      createdRows().map((row) =>
        'sequence_number' in row ? row.sequence_number : null,
      ),
    ).toEqual([1]);
  });

  it('writes one row in one createMany call carrying the single stat block HP and the entity name', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({
      sections: [
        buildSection(
          'basic-stat-block',
          patchBasicStatBlockContent(null, { hp: 7 }),
        ),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createdRows()).toHaveLength(1);
    expect(createdRows()[0]).toMatchObject({
      encounter_id: ENCOUNTER_ID,
      kind: 'combatant',
      base_entity_id: ENTITY_ID,
    });
    expect(sharedFields()).toEqual({ name: 'Goblin', starting_max_hp: 7 });
  });

  it('keeps a stat block HP of 0', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({
      sections: [
        buildSection(
          '5e-stat-block',
          patchFiveEStatBlockContent(null, 'hp', 0),
        ),
      ],
    });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(sharedFields()?.starting_max_hp).toBe(0);
  });

  it.each([
    ['no stat block', []],
    [
      'two stat blocks',
      [
        buildSection(
          'basic-stat-block',
          patchBasicStatBlockContent(null, { hp: 7 }),
        ),
        buildSection(
          'basic-stat-block',
          patchBasicStatBlockContent(null, { hp: 8 }),
        ),
      ],
    ],
    [
      'an empty HP',
      [
        buildSection(
          'basic-stat-block',
          patchBasicStatBlockContent(null, { hp: null }),
        ),
      ],
    ],
  ])(
    'leaves starting_max_hp out of the shared fields for %s',
    async (_, sections) => {
      const { addEntityCombatants } = await import('../encounterQueueService');
      arrange({ sections });

      await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID);

      expect(sharedFields()).not.toHaveProperty('starting_max_hp');
    },
  );

  it('leaves the name out of the shared fields for an unnamed entity', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({ entity: buildBaseEntity({ name: null }) });

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(sharedFields()).not.toHaveProperty('name');
  });

  it('writes the added entry after the insert with the ids createMany returned, in order', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange();
    createMany.mockResolvedValue(['x']);

    await addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(createLogEntry).toHaveBeenCalledWith({
      encounter_id: ENCOUNTER_ID,
      kind: 'added',
      payload: { queueItemIds: ['x'] },
    });
    expect(createMany.mock.invocationCallOrder[0]).toBeLessThan(
      createLogEntry.mock.invocationCallOrder[0],
    );
  });

  it('resolves when the added log write fails after the combatants were stored, so a retry cannot add the batch twice', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange();
    createLogEntry.mockRejectedValue(new Error('log table locked'));

    await expect(
      addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID),
    ).resolves.toBeUndefined();
    expect(createMany).toHaveBeenCalledTimes(1);
  });

  it('writes no added entry and rejects as EncounterQueueAddError when createMany rejects', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange();
    createMany.mockRejectedValue(new Error('disk full'));

    await expect(
      addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID),
    ).rejects.toMatchObject({ name: 'EncounterQueueAddError' });
    expect(createLogEntry).not.toHaveBeenCalled();
  });

  it('rejects an entity that does not exist without any write', async () => {
    const { addEntityCombatants } = await import('../encounterQueueService');
    arrange({ entity: null });

    await expect(
      addEntityCombatants(ENCOUNTER_ID, 'foes', ENTITY_ID),
    ).rejects.toThrow(
      new RegExp(
        `^Failed to add to the encounter queue: BaseEntityNotFoundError: Foe with id ${ENTITY_ID} not found$`,
      ),
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
    const items = [buildEncounterQueueItem({ id: 'a' })];
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

describe('updateQueueItem', () => {
  beforeEach(() => {
    update.mockReset().mockResolvedValue();
  });

  it('updates the item with the id and the data', async () => {
    const { updateQueueItem } = await import('../encounterQueueService');

    await updateQueueItem('a', { custom_name: 'Boss', notes: 'n' });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith('a', {
      custom_name: 'Boss',
      notes: 'n',
    });
  });

  it('rejects as EncounterQueueUpdateError when the update fails', async () => {
    const { updateQueueItem } = await import('../encounterQueueService');
    update.mockRejectedValue(new Error('locked'));

    await expect(
      updateQueueItem('a', { custom_name: 'Boss' }),
    ).rejects.toMatchObject({ name: 'EncounterQueueUpdateError' });
  });
});

const resetAddMocks = () => {
  getAllByEncounter.mockReset().mockResolvedValue([]);
  createMany
    .mockReset()
    .mockImplementation((rows) =>
      Promise.resolve(rows.map((_, index) => `new-${index}`)),
    );
  createLogEntry.mockReset().mockResolvedValue('log-1');
};

describe('addRandomCombatants', () => {
  beforeEach(() => {
    vi.resetModules();
    resetAddMocks();
  });

  const sequenceNumbers = () =>
    createdRows().map((row) =>
      'sequence_number' in row ? row.sequence_number : null,
    );

  it('numbers from the highest sequence number among combatants without an entity and with the same name, with a gap in the existing numbers', async () => {
    const { addRandomCombatants } = await import('../encounterQueueService');
    getAllByEncounter.mockResolvedValue([
      buildEncounterQueueItem({
        id: 'a',
        base_entity_id: null,
        name: 'Grunt',
        sequence_number: 1,
      }),
      buildEncounterQueueItem({
        id: 'b',
        base_entity_id: null,
        name: 'Grunt',
        sequence_number: 4,
      }),
    ]);

    await addRandomCombatants(ENCOUNTER_ID, 'Grunt', null);

    expect(sequenceNumbers()).toEqual([5]);
  });

  it('does not count an event, an entity combatant or a random combatant of another name or letter case', async () => {
    const { addRandomCombatants } = await import('../encounterQueueService');
    getAllByEncounter.mockResolvedValue([
      buildEncounterQueueItem({
        id: 'event',
        kind: 'event',
        base_entity_id: null,
        name: 'Grunt',
        sequence_number: 8,
      }),
      buildEncounterQueueItem({
        id: 'entity',
        base_entity_id: ENTITY_ID,
        name: 'Grunt',
        sequence_number: 8,
      }),
      buildEncounterQueueItem({
        id: 'other-name',
        base_entity_id: null,
        name: 'Brute',
        sequence_number: 8,
      }),
      buildEncounterQueueItem({
        id: 'other-case',
        base_entity_id: null,
        name: 'grunt',
        sequence_number: 8,
      }),
    ]);

    await addRandomCombatants(ENCOUNTER_ID, 'Grunt', null);

    expect(sequenceNumbers()).toEqual([1]);
  });

  it('counts a combatant whose entity was deleted with the random combatants of its name', async () => {
    const { addRandomCombatants } = await import('../encounterQueueService');
    getAllByEncounter.mockResolvedValue([
      buildEncounterQueueItem({
        id: 'orphan',
        base_entity_id: null,
        name: 'Goblin',
        sequence_number: 2,
      }),
    ]);

    await addRandomCombatants(ENCOUNTER_ID, 'Goblin', null);

    expect(sequenceNumbers()).toEqual([3]);
  });

  it('writes one row in one createMany call that continues sort_order, with the trimmed name and no entity', async () => {
    const { addRandomCombatants } = await import('../encounterQueueService');
    getAllByEncounter.mockResolvedValue([
      buildEncounterQueueItem({ id: 'a', sort_order: 5 }),
    ]);

    await addRandomCombatants(ENCOUNTER_ID, '  Grunt ', 10);

    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createdRows()).toEqual([
      {
        encounter_id: ENCOUNTER_ID,
        kind: 'combatant',
        sequence_number: 1,
        sort_order: 6,
      },
    ]);
    expect(sharedFields()).toEqual({ name: 'Grunt', starting_max_hp: 10 });
  });

  it('keeps an HP of 0 and leaves starting_max_hp out for no HP', async () => {
    const { addRandomCombatants } = await import('../encounterQueueService');

    await addRandomCombatants(ENCOUNTER_ID, 'Grunt', 0);
    expect(sharedFields()).toEqual({ name: 'Grunt', starting_max_hp: 0 });

    createMany.mockClear();
    await addRandomCombatants(ENCOUNTER_ID, 'Grunt', null);
    expect(sharedFields()).toEqual({ name: 'Grunt' });
  });

  it.each([
    ['a blank name', ' ', null, /Name is required$/],
    ['HP -1', 'Grunt', -1, /Invalid HP: -1$/],
    ['HP 1.5', 'Grunt', 1.5, /Invalid HP: 1.5$/],
  ])(
    'rejects %s as EncounterQueueAddError before any db call',
    async (_label, name, hp, message) => {
      const { addRandomCombatants } = await import('../encounterQueueService');

      const result = addRandomCombatants(ENCOUNTER_ID, name, hp);

      await expect(result).rejects.toMatchObject({
        name: 'EncounterQueueAddError',
      });
      await expect(result).rejects.toThrow(message);
      expect(getAllByEncounter).not.toHaveBeenCalled();
      expect(createMany).not.toHaveBeenCalled();
    },
  );
});

describe('addEvent', () => {
  beforeEach(() => {
    vi.resetModules();
    resetAddMocks();
  });

  it('writes one event row with the trimmed name, the next sort_order, no sequence number and no entity', async () => {
    const { addEvent } = await import('../encounterQueueService');
    getAllByEncounter.mockResolvedValue([
      buildEncounterQueueItem({ id: 'a', sort_order: 3 }),
    ]);

    await addEvent(ENCOUNTER_ID, ' Lair action ');

    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createdRows()).toEqual([
      { encounter_id: ENCOUNTER_ID, kind: 'event', sort_order: 4 },
    ]);
    expect(sharedFields()).toEqual({ name: 'Lair action' });
  });

  it('rejects a blank name as EncounterQueueAddError before any write', async () => {
    const { addEvent } = await import('../encounterQueueService');

    await expect(addEvent(ENCOUNTER_ID, '   ')).rejects.toMatchObject({
      name: 'EncounterQueueAddError',
    });
    expect(createMany).not.toHaveBeenCalled();
  });
});

describe('the added entry of every add', () => {
  beforeEach(() => {
    vi.resetModules();
    resetAddMocks();
    getBaseEntity.mockReset().mockResolvedValue(buildBaseEntity());
    getAllByBaseEntity.mockReset().mockResolvedValue([]);
    createMany.mockResolvedValue(['x']);
  });

  it.each([
    [
      'a random combatant',
      async () => {
        const { addRandomCombatants } =
          await import('../encounterQueueService');
        await addRandomCombatants(ENCOUNTER_ID, 'Grunt', null);
      },
    ],
    [
      'an event',
      async () => {
        const { addEvent } = await import('../encounterQueueService');
        await addEvent(ENCOUNTER_ID, 'Lair action');
      },
    ],
  ])(
    'is written once after the insert for %s, with the ids createMany returned',
    async (_label, add) => {
      await add();

      expect(createLogEntry).toHaveBeenCalledTimes(1);
      expect(createLogEntry).toHaveBeenCalledWith({
        encounter_id: ENCOUNTER_ID,
        kind: 'added',
        payload: { queueItemIds: ['x'] },
      });
      expect(createMany.mock.invocationCallOrder[0]).toBeLessThan(
        createLogEntry.mock.invocationCallOrder[0],
      );
    },
  );
});

describe('duplicateQueue', () => {
  const SOURCE = 'source-encounter';
  const TARGET = 'target-encounter';

  beforeEach(() => {
    vi.resetModules();
    getAllByEncounter.mockReset();
    getAllLogEntries.mockReset().mockResolvedValue([]);
    duplicateByEncounter.mockReset().mockResolvedValue();
    createLogEntry.mockReset().mockResolvedValue('log-1');
  });

  const copiedMap = () => duplicateByEncounter.mock.calls[0][2];

  it('hands over the derived max HP of each item, null for an item without HP and for an event, and keeps a defeated item', async () => {
    const { duplicateQueue } = await import('../encounterQueueService');
    getAllByEncounter.mockResolvedValue([
      buildEncounterQueueItem({ id: 'raised', starting_max_hp: 10 }),
      buildEncounterQueueItem({ id: 'no-hp', starting_max_hp: null }),
      buildEncounterQueueItem({
        id: 'event',
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        starting_max_hp: null,
      }),
      buildEncounterQueueItem({ id: 'defeated', starting_max_hp: 5 }),
    ]);
    getAllLogEntries.mockResolvedValue([
      buildEncounterLogEntry(
        'max-hp',
        { targets: [{ queueItemId: 'raised', value: 12 }] },
        { id: 'e1' },
      ),
      buildEncounterLogEntry(
        'defeated',
        { queueItemIds: ['defeated'] },
        { id: 'e2' },
      ),
    ]);

    await duplicateQueue(SOURCE, TARGET);

    expect(copiedMap()).toEqual(
      new Map([
        ['raised', 12],
        ['no-hp', null],
        ['event', null],
        ['defeated', 5],
      ]),
    );
  });

  it('leaves out a removed item and keeps one whose removal was reverted', async () => {
    const { duplicateQueue } = await import('../encounterQueueService');
    getAllByEncounter.mockResolvedValue([
      buildEncounterQueueItem({ id: 'gone', starting_max_hp: 5 }),
      buildEncounterQueueItem({ id: 'back', starting_max_hp: 6 }),
    ]);
    getAllLogEntries.mockResolvedValue([
      buildEncounterLogEntry(
        'removed',
        { queueItemIds: ['gone'] },
        { id: 'e1' },
      ),
      buildEncounterLogEntry(
        'removed',
        { queueItemIds: ['back'] },
        { id: 'e2' },
      ),
      buildEncounterLogEntry('revert', { entryId: 'e2' }, { id: 'e3' }),
    ]);

    await duplicateQueue(SOURCE, TARGET);

    expect(copiedMap()).toEqual(new Map([['back', 6]]));
  });

  it('reads the source queue and log and copies from the source into the target', async () => {
    const { duplicateQueue } = await import('../encounterQueueService');
    getAllByEncounter.mockResolvedValue([]);

    await duplicateQueue(SOURCE, TARGET);

    expect(getAllByEncounter).toHaveBeenCalledWith(SOURCE);
    expect(getAllLogEntries).toHaveBeenCalledWith(SOURCE);
    expect(duplicateByEncounter).toHaveBeenCalledWith(
      SOURCE,
      TARGET,
      expect.any(Map),
    );
  });

  it('rejects as EncounterQueueDuplicateError when a read fails', async () => {
    const { duplicateQueue } = await import('../encounterQueueService');
    getAllByEncounter.mockRejectedValue(new Error('locked'));

    await expect(duplicateQueue(SOURCE, TARGET)).rejects.toMatchObject({
      name: 'EncounterQueueDuplicateError',
    });
    expect(duplicateByEncounter).not.toHaveBeenCalled();
  });

  it('writes no log entry', async () => {
    const { duplicateQueue } = await import('../encounterQueueService');
    getAllByEncounter.mockResolvedValue([buildEncounterQueueItem()]);

    await duplicateQueue(SOURCE, TARGET);

    expect(createLogEntry).not.toHaveBeenCalled();
  });
});
