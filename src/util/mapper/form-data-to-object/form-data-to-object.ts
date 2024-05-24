export const mapFormDataToObject = (
  formData: FormData
): { [key: string]: FormDataEntryValue } => {
  const data = Object.fromEntries(formData.entries());
  return data;
};
