'use server';

import { createUser } from '@/db/user';
import { HttpStatusCode } from '@/enums';
import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';

import { FormSubmitResponse } from '@/types/responses';

import { DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { ZodError } from 'zod';

export const submitSignUp = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    const validatedData = parseDataWithZodSchema(data, SchemaName.SIGN_UP);

    await createUser(validatedData);

    return { status: HttpStatusCode.CREATED };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('Could not validate input data');
    }

    if (error instanceof DynamoDBServiceException) {
      if (error.name === 'ConditionalCheckFailedException') {
        return {
          status: HttpStatusCode.CONFLICT,
          error: {
            email: 'Email already in use.',
          },
        };
      }
    }

    throw new Error(`Unknown error during sign up`); //TODO: save error log in db
  }
};
