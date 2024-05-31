import 'server-only';

import { NewAdventureRequestData } from '@/types/requests';
import { dynamoDb } from '../dynamoDb';
import {
  AttributeValue,
  GetItemCommand,
  GetItemCommandInput,
} from '@aws-sdk/client-dynamodb';

export const createAdventure = async (
  adventureData: NewAdventureRequestData
) => {
  console.log('>>>>>>>>> | adventureData:', adventureData);
};

export const getItem = async (tableName: string, key: AttributeValue) => {
  const params: GetItemCommandInput = {
    TableName: tableName,
    Key: { S: key },
  };

  try {
    const command = new GetItemCommand(params);
    const data = await dynamoDb.send(command);
    return data.Item;
  } catch (error) {
    console.error('Error getting item from DynamoDB', error);
    throw new Error(`${error}`);
  }
};
