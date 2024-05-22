export const assertIsString: (value: unknown) => asserts value is string = (
  value
) => {
  if (typeof value !== 'string') {
    throw new Error('Value is not a string');
  }
};
