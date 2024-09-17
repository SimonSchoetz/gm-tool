import 'server-only';

import { DbTable, HttpStatusCode } from '@/enums';
import { convexDb, users } from '../convexDb';
import { Id } from '../../../convex/_generated/dataModel';
import { UserDto } from '@/api/types';

export const updateUser = async (
  userId: string,
  userData: Partial<UserDto>
): Promise<{ status: HttpStatusCode }> => {
  const res = await convexDb.mutation(users.updateUser, {
    userId: userId as Id<DbTable.USERS>,
    userData,
  });
  if (!res) {
    throw new Error(`User with id '${userId}' not found`);
  }
  return res;
};
