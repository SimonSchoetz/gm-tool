import { SchemaName } from '@/schemas/util';
import { assertIsZodSchemaBasedType } from './assert-is-zod-schema-based-type';
import { User } from '@/types/user';

describe('assertIsZodSchemaBasedType', () => {
  it('should throw an error if the data is not valid', () => {
    expect(() =>
      assertIsZodSchemaBasedType<User>({}, SchemaName.USER)
    ).toThrow();
  });
  it('should not throw an error if the data is valid', () => {
    expect(() =>
      assertIsZodSchemaBasedType<User>(
        {
          email: 'test@example.com',
          userContentId: 'content123',
          createdAt: '2022-01-01T00:00:00Z',
          passwordHash: 'hashedPassword',
        },
        SchemaName.USER
      )
    ).not.toThrow();
  });
});
