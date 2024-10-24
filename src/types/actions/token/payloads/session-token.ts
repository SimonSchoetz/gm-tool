import { User } from '@/types/app/user';

export type SessionTokenPayload = {
  fingerprint: string;
  userId: User['id'];
};

export type LocalSessionTokenPayload = {
  sessionId: string;
};
