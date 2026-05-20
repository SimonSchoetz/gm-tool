import z from 'zod';
import { itemTable } from './schema';

export type Item = z.infer<typeof itemTable.zodSchema>;
export type UpdateItemInput = z.infer<typeof itemTable.updateSchema>;
