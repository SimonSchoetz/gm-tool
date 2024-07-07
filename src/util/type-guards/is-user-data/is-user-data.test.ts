import { isUserData } from './is-user-data';
import { userTestData } from '@/schemas/zod-schemas';

describe('isUserData', () => {
  it('should return false if input is not of type FormData', () => {
    const userData = {};
    expect(isUserData(userData)).toBe(false);
  });
  it('should return true if input is FormData', () => {
    expect(isUserData(userTestData)).toBe(true);
  });
});
