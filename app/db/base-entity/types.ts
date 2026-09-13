import z from 'zod';
import { baseEntityTable } from './schema';

export type BaseEntity = z.infer<typeof baseEntityTable.zodSchema>;
export type UpdateBaseEntityInput = z.infer<
  typeof baseEntityTable.updateSchema
>;
