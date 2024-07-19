import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';
import { ZodSchema } from 'zod';

export const assertByZodSchema: <T>(
  data: unknown,
  schemaName: SchemaName
) => asserts data is T = (data, schemaName) => {
  const isExpectedData = parseDataWithZodSchema(data, schemaName);

  if (!isExpectedData) {
    throw new Error(`Expected ${schemaName} data , got: ${data}`);
  }
};
