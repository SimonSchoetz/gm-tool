export type MappedPrototype<T> = Record<
  keyof T,
  { required: boolean; type: string }
>;

export const assertIsMappedDto: <T extends Record<string, any>>(
  mappedData: T,
  mappedPrototype: MappedPrototype<T>
) => asserts mappedData is T = (mappedData, mappedPrototype) => {
  const mappedDataKeys = Object.keys(mappedData);
  const prototypeKeys = Object.keys(mappedPrototype);

  const requiredKeys = prototypeKeys.filter(
    (key) => mappedPrototype[key].required
  );

  const missingKeys = requiredKeys.filter(
    (key) => !mappedDataKeys.includes(key)
  );

  if (missingKeys.length) {
    throw new Error(`Required Keys are missing: ${missingKeys.join(', ')}`);
  }

  const extraKeys = mappedDataKeys.filter(
    (key) => !prototypeKeys.includes(key)
  );

  if (extraKeys.length) {
    throw new Error(`Unknown keys: ${extraKeys.join(', ')}`);
  }

  mappedDataKeys.forEach((key) => {
    const valueType = typeof mappedData[key];
    const expectedType = mappedPrototype[key].type;

    if (valueType !== expectedType) {
      throw new Error(
        `Value of '${key}' is not of type ${expectedType}. Got: ${valueType}`
      );
    }
  });
};
