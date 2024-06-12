export const isFormData: (data: unknown) => boolean = (data) => {
  return data instanceof FormData;
};
