import z from 'zod';
import { npcTable } from './schema';

export type Npc = z.infer<typeof npcTable.zodSchema>;
export type CreateNpcInput = z.infer<typeof npcTable.createSchema>;
export type UpdateNpcInput = z.infer<typeof npcTable.updateSchema>;
