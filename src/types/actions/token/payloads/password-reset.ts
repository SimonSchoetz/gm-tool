import { User } from '@/types/app/user';

export type PasswordResetTokenPayload = {
  email: User['email'];
};
