'use server';

import { HttpStatusCode } from '@/enums';
import { FormSubmitResponse } from '@/types/responses';
import { assertIsString } from '@/util/asserts';
import { readToken } from '../token/read-token';
import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';
import { ZodError } from 'zod';
import { verifyUser } from '../user';

export const submitLogin = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    assertIsString(data);

    const decoded = await readToken(data);

    const validatedData = parseDataWithZodSchema(decoded, SchemaName.LOGIN);

    await verifyUser(validatedData);

    console.log('TODO: Set session token and reroute');
    return { status: HttpStatusCode.ACCEPTED };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('Could not validate input data');
    }

    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error(`Unknown error during login`); //TODO: save error log in db
  }

  // revalidatePath('/login'); thats just an example for when I want to show up added elements
  // in a list so it gets cached again
};
