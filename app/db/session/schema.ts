import { z } from 'zod';

export const sessionSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(1, 'Session title is required')
    .refine((val) => val.trim().length > 0, {
      message: 'Session title is required',
    }),
  description: z.string().optional(),
  session_date: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createSessionSchema = sessionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateSessionSchema = z
  .object({
    title: z
      .string()
      .min(1)
      .refine((val) => val.trim().length > 0, {
        message: 'Session title cannot be empty',
      })
      .optional(),
    description: z.string().optional(),
    session_date: z.string().optional(),
    notes: z.string().optional(),
  })
  .partial();
