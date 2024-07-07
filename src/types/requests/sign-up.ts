import { SignUpSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';

export type SignUpData = z.infer<typeof SignUpSchema>;
