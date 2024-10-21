import { User } from '@/types/app/user';

export type PasswordResetTokenPayload = Pick<User, 'email'>;
