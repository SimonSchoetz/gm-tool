import { z } from 'zod';
import { zUserDto } from '../../api/validators';
import { AppData, DbData } from './generics';
import { EmailVerificationState } from '@/enums';

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
