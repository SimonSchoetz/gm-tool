import { ZodEffects, ZodObject } from 'zod';
import { ValidatorName, getFormDataValidator } from './get-form-data-validator';

describe('getFormDataValidator', () => {
  it('should return a ZodObject', () => {
    const schema = getFormDataValidator(ValidatorName.TEST_Z_OBJECT);
    expect(schema).toBeInstanceOf(ZodObject);
  });

  it('should return a ZodEffects', () => {
    const schema = getFormDataValidator(ValidatorName.TEST_Z_EFFECTS);
    expect(schema).toBeInstanceOf(ZodEffects);
  });
});
