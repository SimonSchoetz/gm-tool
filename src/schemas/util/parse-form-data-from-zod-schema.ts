import { assertIsFormData } from '@/util/asserts';
import { mapFormDataToDto } from '@/util/mapper';
import { isFormData } from '@/util/type-guards';
import { z } from 'zod';

export const parseFormDataFromZodSchema = <T extends z.ZodTypeAny>(
  data: unknown,
  schema: T
): z.infer<T> => {
  try {
    if (isFormData(data)) {
      assertIsFormData(data);
      const mappedData = mapFormDataToDto(data);
      return schema.parse(mappedData);
    }

    return schema.parse(data);
  } catch (error) {
    throw error;
  }
};
