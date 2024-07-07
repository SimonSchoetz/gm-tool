import { User } from '@/types/user';
import { isUserData } from '@/util/type-guards';

export const assertIsUserData: (data: unknown) => asserts data is User = (
  data
) => {
  if (!isUserData(data)) {
    throw new Error(`Expected user data, got: ${data}`);
  }
};
