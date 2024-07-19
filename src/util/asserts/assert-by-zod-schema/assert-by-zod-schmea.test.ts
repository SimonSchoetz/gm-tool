import { SchemaName } from '@/schemas/util';
import { assertByZodSchema } from './assert-by-zod-schema';
import { User } from '@/types/user';

describe('assertByZodSchema', () => {
  it('should throw an error if the data is not valid', () => {
    expect(() => assertByZodSchema<User>({}, SchemaName.USER)).toThrow();
  });
  it('should not throw an error if the data is valid', () => {
    expect(() =>
      assertByZodSchema<User>(
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
