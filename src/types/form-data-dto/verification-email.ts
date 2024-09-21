import { verificationEmailValidator } from '@/validators/form-data-validators';
import { z } from 'zod';

export type VerificationEmailFormData = z.infer<
  typeof verificationEmailValidator
>;
