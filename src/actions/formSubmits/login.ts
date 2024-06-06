'use server';

import { getUser } from '@/db/user';
import { LoginSchema } from '@/schemas/requests';
import { assertIsFormData } from '@/util/asserts';
import { mapFormDataToDto } from '@/util/mapper';
import { mapZodErrorsToErrors } from '@/util/mapper';
import { revalidatePath } from 'next/cache';
import { ZodError, z } from 'zod';

export const submitLogin = async (
  _prevState: any,
  data: unknown
): Promise<
  { message: string } | { error: string | Record<string, string> }
> => {
  try {
    assertIsFormData(data);

    const mappedData = mapFormDataToDto(data);
    const parsed = LoginSchema.parse(mappedData);

    const user = await getUser(parsed.email);

    if (!user.Item) {
      return { error: 'User not found' };
    }

    return { message: 'Success' };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: mapZodErrorsToErrors(error.errors) };
    }

    throw new Error(`Unknown error during login: ${error}`);
  }

  // revalidatePath('/login'); thats just an example for when I want to show up added elements
  // in a list so it gets cached again
};
