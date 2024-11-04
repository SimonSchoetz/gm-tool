import 'server-only';

import { convexDb, users, Id } from '../convexDb';
import { mapToAppDto } from '../util';
import { AppUserData, DbUserData, UserDto } from '@/types/api/db';
import { DbTable, EmailVerificationState } from '@/enums';
import { getSignature } from '../util/get-signature';

export const dbGetUserByEmail = async (
  email: AppUserData['email']
): Promise<AppUserData | null> => {
  const res = await convexDb.query(users.getUserByEmail, {
    email,
    signature: await getSignature(),
  });
  return res ? mapUserDto(res) : null;
};

export const dbGetUserById = async (
  userId: AppUserData['id']
): Promise<AppUserData | null> => {
  const res = await convexDb.query(users.getUserById, {
    userId: userId as Id<DbTable.USERS>,
    signature: await getSignature(),
  });
  return res ? mapUserDto(res) : null;
};

const mapUserDto = (res: DbUserData): AppUserData => {
  const appData = mapToAppDto<UserDto>(res);
  return {
    ...appData,
    emailVerified: res.emailVerified as EmailVerificationState,
  };
};
