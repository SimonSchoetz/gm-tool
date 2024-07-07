import { assertIsUserData } from './assert-is-user-data';
import { userTestData } from '@/schemas/zod-schemas';

describe('assertIsUserData', () => {
  it('should throw an error if input is not of type User', () => {
    const userData = {};

    expect(() => assertIsUserData(userData)).toThrow();
  });

  it('should throw not an error if input is not of type User', () => {
    expect(() => assertIsUserData(userTestData)).not.toThrow();
  });
});
