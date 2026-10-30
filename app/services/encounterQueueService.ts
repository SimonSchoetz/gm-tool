import * as queueItemDb from '@db/encounter-queue-item';
import type {
  EncounterQueueItem,
  UpdateEncounterQueueItemInput,
} from '@db/encounter-queue-item';
import * as logEntryDb from '@db/encounter-log-entry';
import * as baseEntityDb from '@db/base-entity';
import * as sectionDb from '@db/base-entity-content-section';
import {
  baseEntityNotFoundError,
  encounterQueueAddError,
  encounterQueueLoadError,
  encounterQueueReorderError,
  encounterQueueUpdateError,
  parseAddQuantity,
  singleStatBlockHp,
  type BaseEntityType,
} from '@domain';

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
    const queueItems = await queueItemDb.getAllByEncounter(encounterId);

    const firstSortOrder =
      Math.max(-1, ...queueItems.map((item) => item.sort_order)) + 1;
    const firstSequenceNumber =
      Math.max(
        0,
        ...queueItems
          .filter((item) => item.base_entity_id === baseEntityId)
          .map((item) => item.sequence_number ?? 0),
      ) + 1;

    const queueItemIds = await queueItemDb.createMany(
      Array.from({ length: quantity }, (_, index) => ({
        encounter_id: encounterId,
        kind: 'combatant' as const,
        base_entity_id: baseEntityId,
        sequence_number: firstSequenceNumber + index,
        sort_order: firstSortOrder + index,
      })),
      {
        ...(baseEntity.name !== null ? { name: baseEntity.name } : {}),
        ...(startingMaxHp !== null ? { starting_max_hp: startingMaxHp } : {}),
      },
    );

    // The combatants are stored by now. A failed log write loses only its `added` line, which the derivation does not read, and reporting the add as failed would invite a retry that adds the batch twice.
    try {
      await logEntryDb.create({
        encounter_id: encounterId,
        kind: 'added',
        payload: { queueItemIds },
      });
    } catch {
      // Swallowed on purpose: see the comment above.
    }
  } catch (err) {
    throw encounterQueueAddError(err);
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
  data: UpdateEncounterQueueItemInput,
): Promise<void> => {
  try {
    await queueItemDb.update(id, data);
  } catch (err) {
    throw encounterQueueUpdateError(err);
  }
};
