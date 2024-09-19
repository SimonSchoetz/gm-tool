import 'server-only';

import { cache } from 'react';
import { convexDb, users } from '../convexDb';
import { mapToAppDto } from '../util';
import { AppUserData, DbUserData, UserDto } from '../../types/api';
import { DbTable, EmailVerificationState, InternalErrorCode } from '@/enums';
import { Id } from '../../../convex/_generated/dataModel';

export const getUserByEmail = cache(
  async (email: AppUserData['email']): Promise<AppUserData> => {
    const res: DbUserData | null = await convexDb.query(users.getUserByEmail, {
      email,
    });
    if (!res) {
      throw new Error(`${InternalErrorCode.USER_NOT_FOUND}: email '${email}'`);
    }
    return mapUserDto(res);
  }
);

export const getUserById = cache(
  async (userId: AppUserData['id']): Promise<AppUserData> => {
    const res: DbUserData | null = await convexDb.query(users.getUserById, {
      userId: userId as Id<DbTable.USERS>,
    });
    if (!res) {
      throw new Error(`${InternalErrorCode.USER_NOT_FOUND}: id '${userId}'`);
    }
    return mapUserDto(res);
  }
);

const mapUserDto = (res: DbUserData): AppUserData => {
  const appData = mapToAppDto<UserDto>(res);
  return {
    ...appData,
    emailVerified: res.emailVerified as EmailVerificationState,
  };
};
