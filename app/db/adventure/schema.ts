import { z } from 'zod';

export const adventureSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(1, 'Adventure title is required')
    .refine((val) => val.trim().length > 0, {
      message: 'Adventure title is required',
    }),
  description: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createAdventureSchema = adventureSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateAdventureSchema = z
  .object({
    title: z
      .string()
      .min(1)
      .refine((val) => val.trim().length > 0, {
        message: 'Adventure title cannot be empty',
      })
      .optional(),
    description: z.string().optional(),
  })
  .partial();
