import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';

export const isZodSchemaBasedType = <T>(
  data: unknown,
  schemaName: SchemaName
): data is T => {
  try {
    parseDataWithZodSchema(data, schemaName);
    return true;
  } catch {
    return false;
  }
};
