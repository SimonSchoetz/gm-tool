import 'server-only';

import { EmailVerificationState, HttpStatusCode } from '@/enums';
import { SignUpFormData } from '@/types/form-data-dto';
import { encryptPassword } from '@/util/encryption';
import { convexDb, users } from '../convexDb';
import { CreateUserDTO } from '../../../../convex/users';

export const createUser = async (
  data: SignUpFormData
): Promise<{ status: HttpStatusCode }> => {
  const { email, password, userName } = data;

  const signUpFormData = {
    userName,
    email,
    passwordHash: await encryptPassword(password),
    emailVerified: EmailVerificationState.NOT_VERIFIED,
  } satisfies CreateUserDTO;

  return await convexDb.mutation(users.createUser, signUpFormData);
};
