import { verificationEmailValidator } from '@/validators/form-data-validators';
import { z } from 'zod';

export type VerificationEmailData = z.infer<typeof verificationEmailValidator>;
