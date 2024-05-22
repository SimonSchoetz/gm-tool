import { newAdventureRequest } from '@/api/new-adventure-request';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { redirect } from 'next/navigation';

const assertIsString: (value: unknown) => asserts value is string = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Value is not a string');
  }
};

export const createNewAdventure = async (
  data: FormData,
  router: AppRouterInstance
): Promise<void> => {
  const name = data.get('name');

  assertIsString(name);

  try {
    await newAdventureRequest({ name });
    router.push('/');
  } catch (error) {
    console.error('>>>>>>>>> | createNewAdventure | error:', error);
  }
};
