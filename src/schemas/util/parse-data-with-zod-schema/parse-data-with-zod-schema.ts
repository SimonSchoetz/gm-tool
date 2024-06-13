import { assertIsFormData } from '@/util/asserts';
import { mapFormDataToDto } from '@/util/mapper';
import { isFormData } from '@/util/type-guards';
import { z } from 'zod';
import { SchemaName, getSchema } from '../get-schema/get-schema';

export const parseDataWithZodSchema = <T extends z.ZodTypeAny>(
  data: unknown,
  schemaName: SchemaName
): z.infer<T> => {
  const schema = getSchema(schemaName);

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
