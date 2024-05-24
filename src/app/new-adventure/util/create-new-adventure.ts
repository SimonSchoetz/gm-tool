import * as DB from '@/api';
import { assertIsString } from '@/util';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const createNewAdventure = async (
  data: FormData,
  router: AppRouterInstance
): Promise<void> => {
  const name = data.get('name');

  assertIsString(name);

  try {
    await DB.createAdventure({ name });
    router.push('/');
  } catch (error) {
    console.error('>>>>>>>>> | createNewAdventure | error:', error);
  }
};
