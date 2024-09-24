import { LoginValidator } from '@/validators/form-data-validators';
import { z } from 'zod';

export type LoginFormData = z.infer<typeof LoginValidator>;
