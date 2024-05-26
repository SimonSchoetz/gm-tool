export const mapFormDataToDto = (formData: FormData): Record<string, any> => {
  const mappedFormData = Object.fromEntries(formData.entries());

  const dto: Record<string, any> = {};

  Object.keys(mappedFormData).forEach((key): void => {
    const value = mappedFormData[key];
    dto[key] = value;
  });

  return dto;
};
