import { encryptPassword } from './encrypt-password';

describe('encryptPassword', () => {
  it('should only accept strings', () => {
    const noString = 123 as unknown as string;
    expect(encryptPassword(noString)).rejects.toThrow();
  });
  it('should return a string', () => {
    const password = 'password';
    expect(encryptPassword(password)).resolves.toEqual(expect.any(String));
  });
  it('should not return the same string', () => {
    const password = 'password';
    expect(encryptPassword(password)).not.toBe(password);
  });
});
