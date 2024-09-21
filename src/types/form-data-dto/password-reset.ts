import { passwordResetValidator } from '@/validators/form-data-validators';
import { z } from 'zod';

export type PasswordResetFormData = z.infer<typeof passwordResetValidator>;
