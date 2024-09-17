import 'server-only';

import { User } from '@/types/user';
import { cache } from 'react';
import { convexDb, users } from '../convexDb';
import { mapToAppDto } from '../util';
import { AppUserData, DbUserData, UserDto } from '../../api/types';
import { EmailVerificationState } from '@/enums';

export const getUserByEmail = cache(async (email: string): Promise<User> => {
  const res = await convexDb.query(users.getUserByEmail, { email });
  if (!res) {
    throw new Error(`User with email '${email}' not found`);
  }
  return mapUserDto(res);
});

const mapUserDto = (res: DbUserData): AppUserData => {
  const appData = mapToAppDto<UserDto>(res);
  return {
    ...appData,
    emailVerified: res.emailVerified as EmailVerificationState,
  };
};
