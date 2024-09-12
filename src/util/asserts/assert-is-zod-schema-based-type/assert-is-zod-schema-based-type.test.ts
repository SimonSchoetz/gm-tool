import { SchemaName } from '@/schemas/util';
import { assertIsZodSchemaBasedType } from './assert-is-zod-schema-based-type';
import { User } from '@/types/user';
import { userTestData } from '@/schemas/zod-schemas';

describe('assertIsZodSchemaBasedType', () => {
  it('should throw an error if the data is not valid', () => {
    expect(() =>
      assertIsZodSchemaBasedType<User>({}, SchemaName.USER)
    ).toThrow();
  });
  it('should not throw an error if the data is valid', () => {
    expect(() =>
      assertIsZodSchemaBasedType<User>(userTestData, SchemaName.USER)
    ).not.toThrow();
  });
});
