import { newPasswordValidator } from '@/validators/form-data-validators';
import { z } from 'zod';

export type NewPasswordFormData = z.infer<typeof newPasswordValidator>;
