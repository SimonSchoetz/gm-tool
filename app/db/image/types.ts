import z from 'zod';
import { imageTable } from './schema';

export type Image = z.infer<typeof imageTable.zodSchema>;
export type CreateImageInput = { filePath: string };
export type UpdateImageFrameInput = {
  frame_x: number | null;
  frame_y: number | null;
  frame_zoom: number | null;
};
