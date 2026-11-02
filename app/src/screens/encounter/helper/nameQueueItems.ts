import type { BaseEntity } from '@db/base-entity';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import {
  shownCombatantBaseName,
  shownCombatantNames,
  shownEventName,
} from '@domain';

type QueueItemName = {
  shownName: string;
  automaticName: string;
  baseName: string;
};

const toNamedItem = (item: EncounterQueueItem) => ({
  id: item.id,
  baseEntityId: item.base_entity_id,
  name: item.name,
  customName: item.custom_name,
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
  // An event is named by its own function and never enters either numbering pass.
  const combatants = queueItems.filter((item) => item.kind === 'combatant');
  const keptCombatants = combatants.filter(
    (item) => !(combatStateItems.get(item.id)?.removed ?? false),
  );
  // Naming sees every kept combatant, hidden defeated ones included, so toggling Hide defeated never renumbers siblings. A removed combatant is named among all combatants, so it keeps its number in the log.
  const shownNames = new Map([
    ...shownCombatantNames(combatants.map(toNamedItem), entityNamesById),
    ...shownCombatantNames(keptCombatants.map(toNamedItem), entityNamesById),
  ]);

  return new Map(
    queueItems.map((item) => {
      if (item.kind === 'event') {
        const eventName = shownEventName(item.name);
        return [
          item.id,
          {
            shownName: eventName,
            automaticName: eventName,
            baseName: eventName,
          },
        ];
      }
      const baseName = shownCombatantBaseName(
        toNamedItem(item),
        entityNamesById,
      );
      // The pass over all combatants holds one entry per combatant, so this lookup never misses.
      const names = shownNames.get(item.id) ?? {
        shownName: baseName,
        automaticName: baseName,
      };
      return [item.id, { ...names, baseName }];
    }),
  );
};
