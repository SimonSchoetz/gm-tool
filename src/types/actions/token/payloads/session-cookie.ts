import { User } from '@/types/app/user';

export type SessionCookieTokenPayload = {
  userId: User['id'];
  email: User['email'];
  userName: User['userName'];
};
