import z from 'zod';
import { adventureTable } from './schema';

export type Adventure = z.infer<typeof adventureTable.zodSchema>;
export type UpdateAdventureInput = z.infer<typeof adventureTable.updateSchema>;
