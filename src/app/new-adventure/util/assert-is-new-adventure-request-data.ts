import { NewAdventureRequestData } from '@/types';

const requestPrototype: Record<
  keyof NewAdventureRequestData,
  { required: boolean; type: string }
> = {
  name: { required: true, type: 'string' },
  description: { required: false, type: 'string' },
};

export const assertIsNewAdventureRequestData: (
  mappedData: any
) => asserts mappedData is NewAdventureRequestData = (mappedData) => {
  const mappedDataKeys = Object.keys(mappedData);
  const prototypeKeys = Object.keys(requestPrototype);

  const requiredKeys = prototypeKeys.filter(
    (key) => requestPrototype[key as keyof NewAdventureRequestData].required
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
    const expectedType =
      requestPrototype[key as keyof NewAdventureRequestData].type;

    if (valueType !== expectedType) {
      throw new Error(
        `Value of '${key}' is not of type ${expectedType}. Got: ${valueType}`
      );
    }
  });
};
