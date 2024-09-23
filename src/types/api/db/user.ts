import { z } from 'zod';
import { EmailVerificationState } from '@/enums';
import { zUserDto } from '@/api/db/validators';
import { AppData, DbData } from './generics';

/**
 * should only be used in api
 */
export type UserDto = z.infer<typeof zUserDto>;

/**
 * should only be used in api
 */
export type AppUserData = AppData<UserDto> & {
  emailVerified: EmailVerificationState;
};

/**
 * should only be used in api
 */
export type DbUserData = DbData<UserDto>;
