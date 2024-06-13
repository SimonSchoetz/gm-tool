import { SignUpSchema } from '@/schemas/requests';
import { z } from 'zod';

export type SignUpData = z.infer<typeof SignUpSchema>;
