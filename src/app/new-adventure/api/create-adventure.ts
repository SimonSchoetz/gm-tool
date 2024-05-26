import * as DB from '@/db';
import { NewAdventureRequestData, NewAdventureResponseData } from '@/types';

export const createAdventure = async (
  data: NewAdventureRequestData
): Promise<NewAdventureResponseData> => {
  try {
    await DB.createAdventure(data);
    return new Promise(() => {
      return {
        adventureId: '123',
      };
    });
  } catch (error) {
    console.error('>>>>>>>>> | createAdventure | error:', error);
    throw new Error(`Error creating new adventure: ${error}`);
  }
};
