import bcrypt from 'bcrypt';

export const validatePassword = async (
  password: string,
  validatePassword: string
): Promise<boolean> => {
  if (typeof password !== 'string' || typeof validatePassword !== 'string') {
    throw new Error('Falsy inputs during password confirmation');
  }
  return bcrypt.compare(password, validatePassword);
};
