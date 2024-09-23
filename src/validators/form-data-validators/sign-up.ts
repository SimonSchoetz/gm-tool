import { zUserDto } from '@/api/db/validators';
import { z } from 'zod';

export const signUpValidator = z
  .object({
    userName: zUserDto.shape.userName,
    email: zUserDto.shape.email,
    password: z
      .string()
      .min(10, { message: 'Too short, use at least 10 characters.' }),
    confirmPassword: z.string().transform((value) => value),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
