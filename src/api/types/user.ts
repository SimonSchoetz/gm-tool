import { z } from 'zod';
import { zUserDto } from '../validators';
import { AppData, DbData } from './generics';
import { EmailVerificationState } from '@/enums';

export type UserDto = z.infer<typeof zUserDto>;

export type AppUserData = AppData<UserDto> & {
  emailVerified: EmailVerificationState;
};

export type DbUserData = DbData<UserDto>;
