import * as queueItemDb from '@db/encounter-queue-item';
import type {
  CreateEncounterQueueItemInput,
  EncounterQueueItem,
  SharedEncounterQueueItemFields,
  UpdateEncounterQueueItemInput,
} from '@db/encounter-queue-item';
import * as logEntryDb from '@db/encounter-log-entry';
import * as baseEntityDb from '@db/base-entity';
import * as sectionDb from '@db/base-entity-content-section';
import {
  baseEntityNotFoundError,
  deriveCombatState,
  encounterQueueAddError,
  encounterQueueDuplicateError,
  encounterQueueLoadError,
  encounterQueueReorderError,
  encounterQueueUpdateError,
  normalizeQueueItemName,
  parseAddQuantity,
  parseRandomCombatantHp,
  singleStatBlockHp,
  type BaseEntityType,
} from '@domain';

// The rename and the notes only: a queue item's entity, kind and position never change through this write (the entity view relies on a combatant's entity only ever being emptied, and a reorder goes through reorderQueueItems). Only an event's rename passes `name`, never a combatant's, whose `name` is its numbering key and the name stored from its entity.
export type UpdateQueueItemData = Pick<
  UpdateEncounterQueueItemInput,
  'custom_name' | 'name' | 'notes'
>;

type QueueItemsPlan = (
  queueItems: EncounterQueueItem[],
  firstSortOrder: number,
) => {
  rows: CreateEncounterQueueItemInput[];
  shared: SharedEncounterQueueItemFields;
};

const appendQueueItems = async (
  encounterId: string,
  plan: QueueItemsPlan,
): Promise<void> => {
  const queueItems = await queueItemDb.getAllByEncounter(encounterId);
  const firstSortOrder =
    Math.max(-1, ...queueItems.map((item) => item.sort_order)) + 1;
  const { rows, shared } = plan(queueItems, firstSortOrder);

  const queueItemIds = await queueItemDb.createMany(rows, shared);

  // The items are stored by now. A failed log write loses only its `added` line, which the derivation does not read, and reporting the add as failed would invite a retry that adds the batch twice.
  try {
    await logEntryDb.create({
      encounter_id: encounterId,
      kind: 'added',
      payload: { queueItemIds },
    });
  } catch {
    // Swallowed on purpose: see the comment above.
  }
};

const requireQueueItemName = (name: string): string => {
  const normalized = normalizeQueueItemName(name);
  if (normalized === null) {
    throw new Error('Name is required');
  }
  return normalized;
};

export const getQueueItems = async (
  encounterId: string,
): Promise<EncounterQueueItem[]> => {
  try {
    return await queueItemDb.getAllByEncounter(encounterId);
  } catch (err) {
    throw encounterQueueLoadError(err);
  }
};

export const addEntityCombatants = async (
  encounterId: string,
  entityType: BaseEntityType,
  baseEntityId: string,
  quantity: number,
): Promise<void> => {
  try {
    if (parseAddQuantity(String(quantity)) === null) {
      throw new Error(`Invalid quantity: ${quantity}`);
    }

    const baseEntity = await baseEntityDb.get(entityType, baseEntityId);
    if (!baseEntity) {
      throw baseEntityNotFoundError(entityType, baseEntityId);
    }

    const sections = await sectionDb.getAllByBaseEntity(baseEntityId);
    const startingMaxHp = singleStatBlockHp(sections);

    await appendQueueItems(encounterId, (queueItems, firstSortOrder) => {
      const firstSequenceNumber =
        Math.max(
          0,
          ...queueItems
            .filter((item) => item.base_entity_id === baseEntityId)
            .map((item) => item.sequence_number ?? 0),
        ) + 1;

      return {
        rows: Array.from({ length: quantity }, (_, index) => ({
          encounter_id: encounterId,
          kind: 'combatant' as const,
          base_entity_id: baseEntityId,
          sequence_number: firstSequenceNumber + index,
          sort_order: firstSortOrder + index,
        })),
        shared: {
          ...(baseEntity.name !== null ? { name: baseEntity.name } : {}),
          ...(startingMaxHp !== null ? { starting_max_hp: startingMaxHp } : {}),
        },
      };
    });
  } catch (err) {
    throw encounterQueueAddError(err);
  }
};

export const addRandomCombatants = async (
  encounterId: string,
  name: string,
  startingMaxHp: number | null,
  quantity: number,
): Promise<void> => {
  try {
    if (parseAddQuantity(String(quantity)) === null) {
      throw new Error(`Invalid quantity: ${quantity}`);
    }
    const trimmedName = requireQueueItemName(name);
    if (
      startingMaxHp !== null &&
      !parseRandomCombatantHp(String(startingMaxHp)).valid
    ) {
      throw new Error(`Invalid HP: ${startingMaxHp}`);
    }

    await appendQueueItems(encounterId, (queueItems, firstSortOrder) => {
      // A combatant whose entity was deleted has no base entity and a stored name too, so it counts with the random combatants of that name, as shownCombatantNames keys it.
      const firstSequenceNumber =
        Math.max(
          0,
          ...queueItems
            .filter(
              (item) =>
                item.kind === 'combatant' &&
                item.base_entity_id === null &&
                item.name === trimmedName,
            )
            .map((item) => item.sequence_number ?? 0),
        ) + 1;

      return {
        rows: Array.from({ length: quantity }, (_, index) => ({
          encounter_id: encounterId,
          kind: 'combatant' as const,
          sequence_number: firstSequenceNumber + index,
          sort_order: firstSortOrder + index,
        })),
        shared: {
          name: trimmedName,
          ...(startingMaxHp !== null ? { starting_max_hp: startingMaxHp } : {}),
        },
      };
    });
  } catch (err) {
    throw encounterQueueAddError(err);
  }
};

export const addEvent = async (
  encounterId: string,
  name: string,
): Promise<void> => {
  try {
    const trimmedName = requireQueueItemName(name);

    await appendQueueItems(encounterId, (_queueItems, firstSortOrder) => ({
      rows: [
        {
          encounter_id: encounterId,
          kind: 'event' as const,
          sort_order: firstSortOrder,
        },
      ],
      shared: { name: trimmedName },
    }));
  } catch (err) {
    throw encounterQueueAddError(err);
  }
};

export const duplicateQueue = async (
  sourceEncounterId: string,
  targetEncounterId: string,
): Promise<void> => {
  try {
    const queueItems = await queueItemDb.getAllByEncounter(sourceEncounterId);
    const logEntries = await logEntryDb.getAllByEncounter(sourceEncounterId);
    const { items: derivedItems } = deriveCombatState(
      queueItems.map((item) => ({
        id: item.id,
        startingMaxHp: item.starting_max_hp,
      })),
      logEntries,
    );

    // The copy starts at full HP: the derived maximum (a Set max HP edit included) replaces the stored starting value, and an item the source removed is left out.
    const maxHpById = new Map<string, number | null>();
    for (const [id, state] of derivedItems) {
      if (!state.removed) {
        maxHpById.set(id, state.maxHp);
      }
    }

    await queueItemDb.duplicateByEncounter(
      sourceEncounterId,
      targetEncounterId,
      maxHpById,
    );
  } catch (err) {
    throw encounterQueueDuplicateError(err);
  }
};

export const reorderQueueItems = async (
  orderedIds: string[],
): Promise<void> => {
  try {
    for (let index = 0; index < orderedIds.length; index++) {
      await queueItemDb.update(orderedIds[index], { sort_order: index });
    }
  } catch (err) {
    throw encounterQueueReorderError(err);
  }
};

export const updateQueueItem = async (
  id: string,
  data: UpdateQueueItemData,
): Promise<void> => {
  try {
    await queueItemDb.update(id, data);
  } catch (err) {
    throw encounterQueueUpdateError(err);
  }
};
