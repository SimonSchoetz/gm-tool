import { User } from '@/types/app/user';

export type VerifyEmailTokenPayload = {
  email: User['email'];
  verifyEmailHash: User['emailVerified'];
};
