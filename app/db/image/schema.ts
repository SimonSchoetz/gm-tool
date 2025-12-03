import { z } from 'zod';
import { defineTable } from '../util';
import { FileTypes } from '@/types';

const fileExtensions: FileTypes['image'] = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
];

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
      zod: z.enum(fileExtensions),
    },
    original_filename: {
      type: 'TEXT',
      zod: z.string().nullable().optional(),
    },
    file_size: {
      type: 'INTEGER',
      zod: z.number().nullable().optional(),
    },
    created_at: {
      type: 'TEXT',
      default: 'CURRENT_TIMESTAMP',
      zod: z.string().optional(),
    },
    updated_at: {
      type: 'TEXT',
      default: 'CURRENT_TIMESTAMP',
      zod: z.string().optional(),
    },
  },
});
