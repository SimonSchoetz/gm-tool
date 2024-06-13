import { SchemaName, getSchema } from '../get-schema/get-schema';

export const validateSignUpData = (data: unknown, schemaName: SchemaName) => {
  const schema = getSchema(schemaName);
  schema.parse(data);
};
