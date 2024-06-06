import { LoginSchema } from '@/schemas/requests';
import { z } from 'zod';

export type LoginRequestData = z.infer<typeof LoginSchema>;
