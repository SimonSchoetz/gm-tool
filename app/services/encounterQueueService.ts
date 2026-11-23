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
  deriveCombatState,
  encounterQueueAddError,
  encounterQueueDuplicateError,
  encounterQueueLoadError,
  encounterQueueReorderError,
  encounterQueueUpdateError,
  normalizeQueueItemName,
  parseRandomCombatantHp,
  singleStatBlockHp,
  type BaseEntityType,
} from '@domain';

// The rename and the notes only: a queue item's `kind`, `base_entity_id` and `sort_order` never change through this write (`base_entity_id` is only ever emptied, when its entity is deleted, and a reorder goes through reorderQueueItems). Only an event's rename passes `name`, never a combatant's, whose `name` is its numbering key and the name stored from its entity.
export type UpdateQueueItemData = Pick<
  UpdateEncounterQueueItemInput,
  'custom_name' | 'name' | 'notes'
>;

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

export const addEntityCombatant = async (
  encounterId: string,
  entityType: BaseEntityType,
  baseEntityId: string,
): Promise<void> => {
  try {
    const baseEntity = await baseEntityDb.get(entityType, baseEntityId);
    if (!baseEntity) {
      throw baseEntityNotFoundError(entityType, baseEntityId);
    }

    const sections = await sectionDb.getAllByBaseEntity(baseEntityId);
    const startingMaxHp = singleStatBlockHp(sections);

    await queueItemDb.append({
      encounter_id: encounterId,
      kind: 'combatant',
      base_entity_id: baseEntityId,
      ...(baseEntity.name !== null ? { name: baseEntity.name } : {}),
      ...(startingMaxHp !== null ? { starting_max_hp: startingMaxHp } : {}),
    });
  } catch (err) {
    throw encounterQueueAddError(err);
  }
};

export const addRandomCombatant = async (
  encounterId: string,
  name: string,
  startingMaxHp: number | null,
): Promise<void> => {
  try {
    const trimmedName = requireQueueItemName(name);
    if (
      startingMaxHp !== null &&
      !parseRandomCombatantHp(String(startingMaxHp)).valid
    ) {
      throw new Error(`Invalid HP: ${startingMaxHp}`);
    }

    await queueItemDb.append({
      encounter_id: encounterId,
      kind: 'combatant',
      name: trimmedName,
      ...(startingMaxHp !== null ? { starting_max_hp: startingMaxHp } : {}),
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

    await queueItemDb.append({
      encounter_id: encounterId,
      kind: 'event',
      name: trimmedName,
    });
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
    await queueItemDb.updateSortOrders(
      orderedIds.map((id, index) => ({ id, sort_order: index })),
    );
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
