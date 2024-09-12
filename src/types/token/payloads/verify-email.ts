import { User } from '@/types/user';

export type VerifyEmailTokenPayload = {
  email: User['email'];
  verifyEmailHash: User['emailVerified'];
};
