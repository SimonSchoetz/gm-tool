import { User } from '@/types/app/user';

export type VerifyEmailTokenPayload = Pick<User, 'email' | 'emailVerified'>;
