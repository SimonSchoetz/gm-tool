import z from 'zod';
import { foeTable } from './schema';

export type Foe = z.infer<typeof foeTable.zodSchema>;
export type UpdateFoeInput = z.infer<typeof foeTable.updateSchema>;
