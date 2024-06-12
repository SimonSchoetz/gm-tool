import { isFormData } from './is-form-data';

export const assertIsFormData: (data: unknown) => asserts data is FormData = (
  data
) => {
  if (!isFormData(data)) {
    throw new Error(`Expected FormData, got: ${data}`);
  }
};
