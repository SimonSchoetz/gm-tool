import { z } from 'zod';

export const newPasswordValidator = z
  .object({
    token: z.string().optional(), //optional because we get it from the url
    password: z
      .string()
      .min(10, { message: 'Too short, use at least 10 characters.' }),
    confirmPassword: z.string().transform((value) => value),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
