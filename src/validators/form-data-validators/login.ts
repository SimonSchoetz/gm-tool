import { z } from 'zod';

export const LoginValidator = z.object({
  email: z
    .string()
    .email({ message: 'Input is not a valid email' })
    .min(1, { message: 'Email is required' }),
  password: z
    .string()
    .min(10, { message: 'Too short, use at least 10 characters.' }),
});
