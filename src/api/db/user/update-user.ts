import 'server-only';

import { DbTable, HttpStatusCode } from '@/enums';
import { convexDb, users, Id } from '../convexDb';
import { UserDto } from '@/types/api/db';

export const dbUpdateUser = async (
  userId: string,
  userData: Partial<UserDto>
): Promise<{ status: HttpStatusCode }> => {
  return await convexDb.mutation(users.updateUser, {
    userId: userId as Id<DbTable.USERS>,
    userData,
  });
};
