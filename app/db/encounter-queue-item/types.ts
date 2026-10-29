import z from 'zod';
import { encounterQueueItemTable } from './schema';

export type EncounterQueueItem = z.infer<
  typeof encounterQueueItemTable.zodSchema
>;
export type CreateEncounterQueueItemInput = {
  encounter_id: string;
  kind: 'combatant';
  base_entity_id: string;
  sequence_number: number;
  sort_order: number;
};
// Carried by every row of one createMany call, so a batch cannot hold rows with different key sets.
export type SharedEncounterQueueItemFields = {
  name?: string;
  starting_max_hp?: number;
};
export type UpdateEncounterQueueItemInput = z.infer<
  typeof encounterQueueItemTable.updateSchema
>;
