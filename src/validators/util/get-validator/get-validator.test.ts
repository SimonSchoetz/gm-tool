import { ZodEffects, ZodObject } from 'zod';
import { ValidatorName, getValidator } from './get-validator';

describe('getValidator', () => {
  it('should return a ZodObject', () => {
    const schema = getValidator(ValidatorName.TEST_Z_OBJECT);
    expect(schema).toBeInstanceOf(ZodObject);
  });

  it('should return a ZodEffects', () => {
    const schema = getValidator(ValidatorName.TEST_Z_EFFECTS);
    expect(schema).toBeInstanceOf(ZodEffects);
  });
});
