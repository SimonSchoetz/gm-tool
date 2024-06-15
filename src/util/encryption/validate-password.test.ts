import { validatePassword } from './validate-password';
import { encryptPassword } from './encrypt-password';

describe('validatePassword', () => {
  it('should only accept strings', () => {
    const noString = 123 as unknown as string;
    const noString2 = 123 as unknown as string;
    expect(validatePassword(noString, noString2)).rejects.toThrow();
  });
  it('should return a boolean', async () => {
    const password = 'password';
    const passwordHash = await encryptPassword(password);
    expect(validatePassword(password, passwordHash)).resolves.toEqual(
      expect.any(Boolean)
    );
  });
  it('should return true if passwords match', async () => {
    const password = 'password';
    const passwordHash = await encryptPassword(password);
    expect(validatePassword(password, passwordHash)).resolves.toEqual(true);
  });
  it('should return false if passwords do not match', async () => {
    const password = 'password';
    const passwordHash = await encryptPassword('wrongPassword');
    expect(validatePassword(password, passwordHash)).resolves.toEqual(false);
  });
});
