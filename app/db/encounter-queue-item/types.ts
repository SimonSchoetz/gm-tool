import z from 'zod';
import { encounterQueueItemTable } from './schema';

export type EncounterQueueItem = z.infer<
  typeof encounterQueueItemTable.zodSchema
>;
type EncounterQueueItemPlacement = { encounter_id: string; sort_order: number };

// The rows of one createMany call have one shape: a batch cannot hold rows with different key sets, though this union allows a mixed array.
export type CreateEncounterQueueItemInput = EncounterQueueItemPlacement &
  (
    | { kind: 'combatant'; base_entity_id: string; sequence_number: number }
    | { kind: 'combatant'; sequence_number: number }
    | { kind: 'event' }
  );
// Carried by every row of one createMany call, so a batch cannot hold rows with different key sets.
export type SharedEncounterQueueItemFields = {
  name?: string;
  starting_max_hp?: number;
};
// A combatant made from a base entity, a random combatant typed by name, or an event; the position and a combatant's sequence number are computed by append.
export type AppendEncounterQueueItemInput = { encounter_id: string } & (
  | {
      kind: 'combatant';
      base_entity_id: string;
      name?: string;
      starting_max_hp?: number;
    }
  | { kind: 'combatant'; name: string; starting_max_hp?: number }
  | { kind: 'event'; name: string }
);
export type UpdateEncounterQueueItemInput = z.infer<
  typeof encounterQueueItemTable.updateSchema
>;
