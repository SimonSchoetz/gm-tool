import z from 'zod';
import { encounterTable } from './schema';

export type Encounter = z.infer<typeof encounterTable.zodSchema>;
export type UpdateEncounterInput = z.infer<typeof encounterTable.updateSchema>;
