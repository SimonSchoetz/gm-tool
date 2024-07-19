import { User } from '@/types/user';
import { isZodBasedType } from './is-zod-schema-base-type';
import { SchemaName } from '@/schemas/util';
import { userTestData } from '@/schemas/zod-schemas';

describe('isZodBasedType', () => {
  it('should return true if the data is valid', () => {
    expect(isZodBasedType<User>(userTestData, SchemaName.USER)).toBe(true);
  });
  it('should return false if the data is invalid', () => {
    expect(isZodBasedType<User>({}, SchemaName.USER)).toBe(false);
  });
});
