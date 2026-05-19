import z from 'zod';
import { pcTable } from './schema';

export type Pc = z.infer<typeof pcTable.zodSchema>;
export type UpdatePcInput = z.infer<typeof pcTable.updateSchema>;
