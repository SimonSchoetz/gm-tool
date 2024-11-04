import 'server-only';

import { DbTable, HttpStatusCode } from '@/enums';
import { convexDb, users, Id } from '../convexDb';
import { UserDto } from '@/types/api/db';
import { getSignature } from '../util/get-signature';

export const dbUpdateUser = async (
  userId: string,
  userData: Partial<UserDto>
): Promise<{ status: HttpStatusCode }> => {
  return await convexDb.mutation(users.updateUser, {
    userId: userId as Id<DbTable.USERS>,
    userData,
    signature: await getSignature(),
  });
};
