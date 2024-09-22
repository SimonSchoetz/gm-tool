import { passwordResetEmailValidator } from '@/validators/form-data-validators';
import { z } from 'zod';

export type PasswordResetFormEmailData = z.infer<
  typeof passwordResetEmailValidator
>;
