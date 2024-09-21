import { ZodEffects, ZodObject, ZodTypeAny, z } from 'zod';
import {
  ValidatorName,
  getFormDataValidator,
} from '../get-validator/get-validator';

export const getKeysFromZodValidator = <T extends ZodTypeAny>(
  schemaName: ValidatorName
): (keyof z.infer<T>)[] => {
  const schema = getFormDataValidator(schemaName);
  if (schema instanceof ZodObject) {
    return Object.keys(schema.shape) as (keyof z.infer<T>)[];
  }
  if (schema instanceof ZodEffects) {
    return Object.keys(schema._def.schema.shape) as (keyof z.infer<T>)[];
  }

  throw new Error('Unexpected schema type');
};
