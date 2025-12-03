import z from 'zod';
import { imageTable } from './schema';

export type Image = z.infer<typeof imageTable.zodSchema>;
export type CreateImageInput = { filePath: string };
