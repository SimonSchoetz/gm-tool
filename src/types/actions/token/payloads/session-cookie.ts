import { User } from '@/types/app/user';

export type SessionCookieTokenPayload = Pick<User, 'id' | 'email' | 'userName'>;
