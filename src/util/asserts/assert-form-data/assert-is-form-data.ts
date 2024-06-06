export const assertIsFormData: (data: unknown) => asserts data is FormData = (
  data
) => {
  if (!(data instanceof FormData)) {
    throw new Error(`Expected FormData, got: ${data}`);
  }
};
