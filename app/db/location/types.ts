import z from 'zod';
import { locationTable } from './schema';

export type Location = z.infer<typeof locationTable.zodSchema>;
export type UpdateLocationInput = z.infer<typeof locationTable.updateSchema>;
