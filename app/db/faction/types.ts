import z from 'zod';
import { factionTable } from './schema';

export type Faction = z.infer<typeof factionTable.zodSchema>;
export type UpdateFactionInput = z.infer<typeof factionTable.updateSchema>;
