import { VerificationEmailSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';

export type VerificationEmailData = z.infer<typeof VerificationEmailSchema>;
