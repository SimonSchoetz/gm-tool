import { TypedFormData } from '@/types/generics';

export const mapFormDataToObject = <T>(
  formData: FormData
): TypedFormData<T> => {
  const data = Object.fromEntries(formData.entries());
  return data as TypedFormData<T>;
};
