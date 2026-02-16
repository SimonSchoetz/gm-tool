import z from 'zod';
import { tableConfigTable } from './schema';

export type TableConfig = z.infer<typeof tableConfigTable.zodSchema>;
export type UpdateTableConfigInput = z.infer<typeof tableConfigTable.updateSchema>;
