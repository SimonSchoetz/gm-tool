import { z } from 'zod';

export const LoginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Input is not a valid email' })
    .min(1, { message: 'Email is required' }),
});
