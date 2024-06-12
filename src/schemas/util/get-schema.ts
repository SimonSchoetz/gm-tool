import { ZodTypeAny } from 'zod';
import * as s from '../requests';

export enum Schema {
  SIGN_UP = 'sign-up',
  LOGIN = 'login',
}

export const getSchema = (schema: Schema): ZodTypeAny => {
  const map: Record<Schema, ZodTypeAny> = {
    [Schema.SIGN_UP]: s.SignUpSchema,
    [Schema.LOGIN]: s.LoginSchema,
  };
  return map[schema] as ZodTypeAny;
};
