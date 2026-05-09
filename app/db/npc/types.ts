import z from 'zod';
import { npcTable } from './schema';

export type Npc = z.infer<typeof npcTable.zodSchema>;
export type UpdateNpcInput = z.infer<typeof npcTable.updateSchema>;
