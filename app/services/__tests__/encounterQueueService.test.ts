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
const append = vi.hoisted(() => vi.fn<typeof queueItemDb.append>());
const updateSortOrders = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.updateSortOrders>(),
);
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
  append,
  update,
  updateSortOrders,
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

const appended = () => append.mock.calls[0][0];

describe('addEntityCombatant', () => {
  beforeEach(() => {
    vi.resetModules();
    getAllByEncounter.mockReset();
    append.mockReset().mockResolvedValue('new-0');
    update.mockReset().mockResolvedValue();
    createLogEntry.mockReset().mockResolvedValue('log-1');
    getBaseEntity.mockReset();
    getAllByBaseEntity.mockReset();
  });

  it('appends one combatant carrying the single stat block HP and the entity name', async () => {
    const { addEntityCombatant } = await import('../encounterQueueService');
    arrange({
      sections: [
        buildSection(
          'basic-stat-block',
          patchBasicStatBlockContent(null, { hp: 7 }),
        ),
      ],
    });

    await addEntityCombatant(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(append).toHaveBeenCalledTimes(1);
    expect(appended()).toEqual({
      encounter_id: ENCOUNTER_ID,
      kind: 'combatant',
      base_entity_id: ENTITY_ID,
      name: 'Goblin',
      starting_max_hp: 7,
    });
  });

  it('keeps a stat block HP of 0', async () => {
    const { addEntityCombatant } = await import('../encounterQueueService');
    arrange({
      sections: [
        buildSection(
          '5e-stat-block',
          patchFiveEStatBlockContent(null, 'hp', 0),
        ),
      ],
    });

    await addEntityCombatant(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(appended()).toMatchObject({ starting_max_hp: 0 });
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
    'leaves starting_max_hp out of the appended item for %s',
    async (_, sections) => {
      const { addEntityCombatant } = await import('../encounterQueueService');
      arrange({ sections });

      await addEntityCombatant(ENCOUNTER_ID, 'foes', ENTITY_ID);

      expect(appended()).not.toHaveProperty('starting_max_hp');
    },
  );

  it('leaves the name out of the appended item for an unnamed entity', async () => {
    const { addEntityCombatant } = await import('../encounterQueueService');
    arrange({ entity: buildBaseEntity({ name: null }) });

    await addEntityCombatant(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(appended()).not.toHaveProperty('name');
  });

  it('writes the added entry after the insert with the id append returned', async () => {
    const { addEntityCombatant } = await import('../encounterQueueService');
    arrange();
    append.mockResolvedValue('x');

    await addEntityCombatant(ENCOUNTER_ID, 'foes', ENTITY_ID);

    expect(createLogEntry).toHaveBeenCalledWith({
      encounter_id: ENCOUNTER_ID,
      kind: 'added',
      payload: { queueItemIds: ['x'] },
    });
    expect(append.mock.invocationCallOrder[0]).toBeLessThan(
      createLogEntry.mock.invocationCallOrder[0],
    );
  });

  it('resolves when the added log write fails after the combatant was stored, so a retry cannot add it twice', async () => {
    const { addEntityCombatant } = await import('../encounterQueueService');
    arrange();
    createLogEntry.mockRejectedValue(new Error('log table locked'));

    await expect(
      addEntityCombatant(ENCOUNTER_ID, 'foes', ENTITY_ID),
    ).resolves.toBeUndefined();
    expect(append).toHaveBeenCalledTimes(1);
  });

  it('writes no added entry and rejects as EncounterQueueAddError when append rejects', async () => {
    const { addEntityCombatant } = await import('../encounterQueueService');
    arrange();
    append.mockRejectedValue(new Error('disk full'));

    await expect(
      addEntityCombatant(ENCOUNTER_ID, 'foes', ENTITY_ID),
    ).rejects.toMatchObject({ name: 'EncounterQueueAddError' });
    expect(createLogEntry).not.toHaveBeenCalled();
  });

  it('rejects an entity that does not exist without any write', async () => {
    const { addEntityCombatant } = await import('../encounterQueueService');
    arrange({ entity: null });

    await expect(
      addEntityCombatant(ENCOUNTER_ID, 'foes', ENTITY_ID),
    ).rejects.toThrow(
      new RegExp(
        `^Failed to add to the encounter queue: BaseEntityNotFoundError: Foe with id ${ENTITY_ID} not found$`,
      ),
    );
    expect(append).not.toHaveBeenCalled();
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
    updateSortOrders.mockReset().mockResolvedValue();
  });

  it('gives each id its array index as sort_order, in one write', async () => {
    const { reorderQueueItems } = await import('../encounterQueueService');

    await reorderQueueItems(['c', 'a', 'b']);

    expect(updateSortOrders.mock.calls).toEqual([
      [
        [
          { id: 'c', sort_order: 0 },
          { id: 'a', sort_order: 1 },
          { id: 'b', sort_order: 2 },
        ],
      ],
    ]);
  });

  it('rejects as EncounterQueueReorderError when the write fails', async () => {
    const { reorderQueueItems } = await import('../encounterQueueService');
    updateSortOrders.mockRejectedValue(new Error('locked'));

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
  append.mockReset().mockResolvedValue('new-0');
  createLogEntry.mockReset().mockResolvedValue('log-1');
};

describe('addRandomCombatant', () => {
  beforeEach(() => {
    vi.resetModules();
    resetAddMocks();
  });

  it('appends one combatant with the trimmed name and no entity', async () => {
    const { addRandomCombatant } = await import('../encounterQueueService');

    await addRandomCombatant(ENCOUNTER_ID, '  Grunt ', 10);

    expect(append).toHaveBeenCalledTimes(1);
    expect(appended()).toEqual({
      encounter_id: ENCOUNTER_ID,
      kind: 'combatant',
      name: 'Grunt',
      starting_max_hp: 10,
    });
  });

  it('keeps an HP of 0 and leaves starting_max_hp out for no HP', async () => {
    const { addRandomCombatant } = await import('../encounterQueueService');

    await addRandomCombatant(ENCOUNTER_ID, 'Grunt', 0);
    expect(appended()).toMatchObject({ starting_max_hp: 0 });

    append.mockClear();
    await addRandomCombatant(ENCOUNTER_ID, 'Grunt', null);
    expect(appended()).not.toHaveProperty('starting_max_hp');
  });

  it.each([
    ['a blank name', ' ', null, /Name is required$/],
    ['HP -1', 'Grunt', -1, /Invalid HP: -1$/],
    ['HP 1.5', 'Grunt', 1.5, /Invalid HP: 1.5$/],
  ])(
    'rejects %s as EncounterQueueAddError before any db call',
    async (_label, name, hp, message) => {
      const { addRandomCombatant } = await import('../encounterQueueService');

      const result = addRandomCombatant(ENCOUNTER_ID, name, hp);

      await expect(result).rejects.toMatchObject({
        name: 'EncounterQueueAddError',
      });
      await expect(result).rejects.toThrow(message);
      expect(getAllByEncounter).not.toHaveBeenCalled();
      expect(append).not.toHaveBeenCalled();
    },
  );
});

describe('addEvent', () => {
  beforeEach(() => {
    vi.resetModules();
    resetAddMocks();
  });

  it('appends one event with the trimmed name and no entity', async () => {
    const { addEvent } = await import('../encounterQueueService');

    await addEvent(ENCOUNTER_ID, ' Lair action ');

    expect(append).toHaveBeenCalledTimes(1);
    expect(appended()).toEqual({
      encounter_id: ENCOUNTER_ID,
      kind: 'event',
      name: 'Lair action',
    });
  });

  it('rejects a blank name as EncounterQueueAddError before any write', async () => {
    const { addEvent } = await import('../encounterQueueService');

    await expect(addEvent(ENCOUNTER_ID, '   ')).rejects.toMatchObject({
      name: 'EncounterQueueAddError',
    });
    expect(append).not.toHaveBeenCalled();
  });
});

describe('the added entry of every add', () => {
  beforeEach(() => {
    vi.resetModules();
    resetAddMocks();
    getBaseEntity.mockReset().mockResolvedValue(buildBaseEntity());
    getAllByBaseEntity.mockReset().mockResolvedValue([]);
    append.mockResolvedValue('x');
  });

  it.each([
    [
      'a random combatant',
      async () => {
        const { addRandomCombatant } = await import('../encounterQueueService');
        await addRandomCombatant(ENCOUNTER_ID, 'Grunt', null);
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
    'is written once after the insert for %s, with the id append returned',
    async (_label, add) => {
      await add();

      expect(createLogEntry).toHaveBeenCalledTimes(1);
      expect(createLogEntry).toHaveBeenCalledWith({
        encounter_id: ENCOUNTER_ID,
        kind: 'added',
        payload: { queueItemIds: ['x'] },
      });
      expect(append.mock.invocationCallOrder[0]).toBeLessThan(
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
