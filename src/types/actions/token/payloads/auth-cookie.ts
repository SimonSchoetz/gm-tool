import { User } from '@/types/app/user';

export type AuthCookieTokenPayload = {
  userId: User['id'];
  email: User['email'];
  userName: User['userName'];
};
