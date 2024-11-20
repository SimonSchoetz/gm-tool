import 'server-only';

import { DbTable, EmailVerificationState, HttpStatusCode } from '@/enums';
import { SignUpFormData } from '@/types/actions';
import { encryptPassword } from '@/util/encryption';
import { convexDb, Id, users } from '../convexDb';
import { getSignature } from '../util/get-signature';

export const dbCreateUser = async (
  data: SignUpFormData
): Promise<{
  status: HttpStatusCode;
  id: Id<DbTable.USERS>;
}> => {
  const { email, password, userName } = data;

  const signUpFormData = {
    userName,
    email,
    passwordHash: await encryptPassword(password),
    emailVerified: EmailVerificationState.NOT_VERIFIED,
    signature: await getSignature(),
  };

  return await convexDb.mutation(users.createUser, signUpFormData);
};
