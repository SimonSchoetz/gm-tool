import { z } from 'zod';
import { IMAGE_FILE_EXTENSIONS } from '@domain';
import { defineTable } from '../util';

export const imageTable = defineTable({
  name: 'images',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string(),
    },
    file_extension: {
      type: 'TEXT',
      notNull: true,
      zod: z.enum(IMAGE_FILE_EXTENSIONS),
    },
    original_filename: {
      type: 'TEXT',
      zod: z.string().nullable().optional(),
    },
    file_size: {
      type: 'INTEGER',
      zod: z.number().nullable().optional(),
    },
    frame_x: {
      type: 'REAL',
      zod: z.number().nullable().optional(),
    },
    frame_y: {
      type: 'REAL',
      zod: z.number().nullable().optional(),
    },
    frame_zoom: {
      type: 'REAL',
      zod: z.number().nullable().optional(),
    },
    created_at: {
      type: 'TEXT',
      notNull: true,
      zod: z.string(),
    },
    updated_at: {
      type: 'TEXT',
      notNull: true,
      zod: z.string(),
    },
  },
});
