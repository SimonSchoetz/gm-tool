import { EmailVerificationState } from '@/enums';
import { User } from '@/types/user';
import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().min(1),
  userContentId: z.string().min(1),
  createdAt: z.string().min(1),
  passwordHash: z.string().min(1),
  emailVerified: z.nativeEnum(EmailVerificationState),
});

export const userTestData: User = {
  email: 'test',
  userContentId: 'test',
  createdAt: 'test',
  passwordHash: 'test',
  emailVerified: EmailVerificationState.VERIFIED,
};
