import 'server-only';

import {
  GetItemCommand,
  GetItemCommandInput,
  GetItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { dynamoDb } from '../dynamoDb';
import { DbTable } from '@/enums';

export const getUser = async (email: string): Promise<GetItemCommandOutput> => {
  const params: GetItemCommandInput = {
    TableName: DbTable.USERS,
    Key: { userId: { S: email } },
  };

  const command = new GetItemCommand(params);

  return await dynamoDb.send(command);
};
