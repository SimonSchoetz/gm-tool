import { z } from 'zod';

export const SignUpSchema = z.object({
  email: z
    .string()
    .email({ message: 'Input is not a valid email' })
    .min(1, { message: 'Email is required' }),
  displayName: z.string().min(1, { message: 'Display Name is required' }),
  createdAt: z
    .string()
    .min(1, { message: 'Date is required' })
    .datetime({ message: 'Date time error' }),
});
