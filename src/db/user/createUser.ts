import 'server-only';

import {
  PutItemCommand,
  PutItemCommandInput,
  PutItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { dynamoDb } from '../dynamoDb';
import { DbTable } from '@/enums';
import { SignUpRequestData } from '@/types/requests';

export const createUser = async ({
  email,
  displayName,
  createdAt,
}: SignUpRequestData): Promise<PutItemCommandOutput> => {
  const params: PutItemCommandInput = {
    TableName: DbTable.USERS,
    Item: {
      userId: { S: email },
      displayName: { S: displayName },
      createdAt: { S: createdAt },
    },
    ConditionExpression: 'attribute_not_exists(#pk)',
    ExpressionAttributeNames: {
      '#pk': 'userId',
    },
  };

  const command = new PutItemCommand(params);

  return await dynamoDb.send(command);
};
