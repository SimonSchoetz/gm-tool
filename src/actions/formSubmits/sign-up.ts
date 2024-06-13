'use server';

import { createUser } from '@/db/user';
import { SignUpSchema } from '@/schemas/requests';
import { parseFormDataFromZodSchema } from '@/schemas/util';

import { FormSubmitResponse } from '@/types/responses';

import { DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { ZodError } from 'zod';

export const submitSignUp = async (
  _prevState: any,
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    const validatedData = parseFormDataFromZodSchema(data, SignUpSchema);

    await createUser(validatedData);

    return { message: 'Success' };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('Could validate input data');
    }

    if (error instanceof DynamoDBServiceException) {
      if (error.name === 'ConditionalCheckFailedException') {
        return {
          error: {
            email:
              'Email already in use. Please use another email or contact the developer. Password reset self-service is not yet supported.',
          },
        };
      }
    }

    throw new Error(`Unknown error during sign up: ${error}`);
  }
};
