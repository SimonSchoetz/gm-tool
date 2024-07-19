import { User } from '@/types/user';
import { isZodSchemaBasedType } from './is-zod-schema-base-type';
import { SchemaName } from '@/schemas/util';
import { userTestData } from '@/schemas/zod-schemas';

describe('isZodBasedType', () => {
  it('should return true if the data is valid', () => {
    expect(isZodSchemaBasedType<User>(userTestData, SchemaName.USER)).toBe(
      true
    );
  });
  it('should return false if the data is invalid', () => {
    expect(isZodSchemaBasedType<User>({}, SchemaName.USER)).toBe(false);
  });
});
