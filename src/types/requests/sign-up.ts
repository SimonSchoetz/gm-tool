import { signUpValidator } from '@/validators/form-data-validators';
import { z } from 'zod';

export type SignUpData = z.infer<typeof signUpValidator>;

export const signUpTestData: SignUpData = {
  email: 'test@test.com',
  password: 'test12356789',
  confirmPassword: 'test12356789',
};
