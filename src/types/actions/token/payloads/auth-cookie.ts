import { User } from '@/types/app/user';

export type AuthCookieTokenPayload = {
  userId: User['id'];
};
