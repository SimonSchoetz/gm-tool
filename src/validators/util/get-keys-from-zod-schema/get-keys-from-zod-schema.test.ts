import { getKeysFromZodValidator } from './get-keys-from-zod-schema';
import { ValidatorName } from '../get-form-data-validator/get-form-data-validator';

describe('getKeysFromZodValidator', () => {
  it('should return an array of keys if it is a ZodObject', () => {
    const keys = getKeysFromZodValidator(ValidatorName.TEST_Z_OBJECT);
    expect(keys).toEqual(['name', 'age']);
  });

  it('should return an array of keys if it is a ZodEffects', () => {
    const keys = getKeysFromZodValidator(ValidatorName.TEST_Z_EFFECTS);
    expect(keys).toEqual(['name', 'age', 'optionalField']);
  });
});
