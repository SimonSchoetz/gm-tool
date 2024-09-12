export const mapFormDataToDto = <T extends Record<string, unknown>>(
  formData: FormData
): T => {
  const mappedFormData = Object.fromEntries(formData.entries());

  const dto = {} as T;

  Object.keys(mappedFormData).forEach((key): void => {
    if (!key.includes('$ACTION_ID')) {
      const value = mappedFormData[key];
      (dto as Record<string, unknown>)[key] = value;
    }
  });

  return dto;
};
