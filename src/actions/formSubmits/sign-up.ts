'use server';

import { createUser } from '@/db/user';
import { SignUpSchema } from '@/schemas/requests';
import { FormSubmitResponse } from '@/types/responses';
import { assertIsFormData } from '@/util/asserts';
import { mapFormDataToDto } from '@/util/mapper';
import { mapZodErrorsToErrors } from '@/util/mapper';
import { DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { ZodError } from 'zod';

export const submitSignUp = async (
  _prevState: any,
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    assertIsFormData(data);

    const mappedData = mapFormDataToDto(data);

    mappedData.createdAt = new Date().toISOString();

    const parsed = SignUpSchema.parse(mappedData);

    await createUser(parsed);

    return { message: 'Success' };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: mapZodErrorsToErrors(error.errors) };
    }

    if (error instanceof DynamoDBServiceException) {
      if (error.name === 'ConditionalCheckFailedException') {
        return {
          error: { email: 'An account with this email already exists.' },
        };
      }
    }

    throw new Error(`Unknown error during sign up: ${error}`);
  }
};
