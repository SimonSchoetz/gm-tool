import { z } from 'zod';

export const passwordResetEmailValidator = z.object({
  email: z
    .string()
    .email({ message: 'Input is not a valid email' })
    .min(1, { message: 'Email is required' }),
});
