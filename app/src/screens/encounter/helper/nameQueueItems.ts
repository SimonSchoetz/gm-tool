import type { BaseEntity } from '@db/base-entity';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import { shownCombatantBaseName, shownCombatantNames } from '@domain';

type QueueItemName = { shownName: string; baseName: string };

const toNamedItem = (item: EncounterQueueItem) => ({
  id: item.id,
  baseEntityId: item.base_entity_id,
  name: item.name,
  sequenceNumber: item.sequence_number,
});

export const nameQueueItems = (
  queueItems: EncounterQueueItem[],
  combatStateItems: ReadonlyMap<string, { removed: boolean }>,
  baseEntities: BaseEntity[],
): Map<string, QueueItemName> => {
  const entityNamesById = new Map(
    baseEntities.map((entity) => [entity.id, entity.name]),
  );
  const keptItems = queueItems.filter(
    (item) => !(combatStateItems.get(item.id)?.removed ?? false),
  );
  // Naming sees every kept item, hidden defeated ones included, so toggling Hide defeated never renumbers siblings. A removed item is named among all items, so it keeps its number in the log.
  const shownNames = new Map([
    ...shownCombatantNames(queueItems.map(toNamedItem), entityNamesById),
    ...shownCombatantNames(keptItems.map(toNamedItem), entityNamesById),
  ]);

  return new Map(
    queueItems.map((item) => {
      const baseName = shownCombatantBaseName(
        toNamedItem(item),
        entityNamesById,
      );
      return [
        item.id,
        { shownName: shownNames.get(item.id) ?? baseName, baseName },
      ];
    }),
  );
};
