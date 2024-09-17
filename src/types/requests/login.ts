import { LoginValidator } from '@/validators/form-data-validators';
import { z } from 'zod';

export type LoginData = z.infer<typeof LoginValidator>;
