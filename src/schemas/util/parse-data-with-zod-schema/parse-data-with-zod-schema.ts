import { assertIsFormData } from '@/util/asserts';
import { mapFormDataToDto } from '@/util/mapper';
import { isFormData } from '@/util/type-guards';
import { SchemaName, getSchema } from '../get-schema/get-schema';

export const parseDataWithZodSchema = <T>(
  data: unknown,
  schemaName: SchemaName
): T => {
  const schema = getSchema(schemaName);

  if (isFormData(data)) {
    assertIsFormData(data);
    const mappedData = mapFormDataToDto(data);
    return schema.parse(mappedData) as T;
  }

  return schema.parse(data) as T;
};
