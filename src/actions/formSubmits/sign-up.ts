'use server';

import { createUser, getUser } from '@/db/user';
import { HttpStatusCode, Route } from '@/enums';
import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';

import { FormSubmitResponse } from '@/types/responses';

import { DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { ZodError } from 'zod';
import { readToken } from '../token/read-token';
import { assertIsString } from '@/util/asserts';
import { setAuthCookie } from '../cookies';

export const submitSignUp = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    assertIsString(data);
    const decoded = await readToken(data);
    const validatedData = parseDataWithZodSchema(decoded, SchemaName.SIGN_UP);

    await createUser(validatedData);

    const user = await getUser(validatedData.email);
    await setAuthCookie(user);

    return {
      status: HttpStatusCode.CREATED,
      redirectRoute: Route.HOME,
    };
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

    throw new Error(`Unknown error during sign up: "${error}"`); //TODO: save error log in db
  }
};
