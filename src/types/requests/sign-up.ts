import { SignUpSchema } from '@/schemas/requests';
import { z } from 'zod';

export type SignUpRequestData = z.infer<typeof SignUpSchema>;
