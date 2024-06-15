import bcrypt from 'bcrypt';

export const encryptPassword = async (password: string): Promise<string> => {
  if (typeof password !== 'string') {
    throw new Error('Password must be a string');
  }
  return bcrypt.hashSync(password, 10);
};
