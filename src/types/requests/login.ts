import { LoginSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';

export type LoginData = z.infer<typeof LoginSchema>;
