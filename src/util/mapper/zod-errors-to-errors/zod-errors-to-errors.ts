import { ZodError } from 'zod';

export const mapZodErrorsToErrors = (
  errors: ZodError['errors']
): Record<string, string> => {
  const mappedErrors: Record<string, string> = {};
  errors.forEach((error) => {
    mappedErrors[error.path[0]] = error.message;
  });
  return mappedErrors;
};
