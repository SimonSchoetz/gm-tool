import { User } from '@/types/app/user';

export type SessionTokenPayload = {
  fingerprint: string;
  sessionId: string;
  userId: User['id'];
};
