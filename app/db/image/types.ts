import z from 'zod';
import { imageTable } from './schema';

export type Image = z.infer<typeof imageTable.zodSchema>;
export type CreateImageInput = z.infer<typeof imageTable.createSchema>;
export type UpdateImageInput = z.infer<typeof imageTable.updateSchema>;
