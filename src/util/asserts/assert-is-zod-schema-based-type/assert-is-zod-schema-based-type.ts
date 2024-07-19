import { SchemaName } from '@/schemas/util';
import { isZodSchemaBasedType } from '@/util/type-guards';

export const assertIsZodSchemaBasedType: <T>(
  data: unknown,
  schemaName: SchemaName
) => asserts data is T = (data, schemaName) => {
  const isExpectedData = isZodSchemaBasedType(data, schemaName);

  if (!isExpectedData) {
    throw new Error(`Expected ${schemaName} data , got: ${data}`);
  }
};
