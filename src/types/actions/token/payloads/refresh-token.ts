import { User } from '@/types/app/user';

export type RefreshTokenPayload = {
  fingerprint: string;
  sessionId: string;
  userId: User['id'];
};
