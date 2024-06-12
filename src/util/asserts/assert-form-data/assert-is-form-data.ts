import { isFormData } from '@/util/type-guards';

export const assertIsFormData: (data: unknown) => asserts data is FormData = (
  data
) => {
  if (!isFormData(data)) {
    throw new Error(`Expected FormData, got: ${data}`);
  }
};
