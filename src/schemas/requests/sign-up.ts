import { z } from 'zod';

export const SignUpSchema = z
  .object({
    email: z.string().email(),
    displayName: z.string().min(1, { message: 'Display Name is required' }),
    password: z
      .string()
      .min(10, { message: 'Too short, use at least 10 characters.' }),
    confirmPassword: z.string().transform((value) => value),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
