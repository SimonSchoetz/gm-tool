import 'server-only';

import {
  PutItemCommand,
  PutItemCommandInput,
  PutItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { dynamoDb } from '../dynamoDb';
import { DbTable } from '@/enums';
import { SignUpData } from '@/types/requests';
import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';

export const createUser = async (
  data: SignUpData
): Promise<PutItemCommandOutput> => {
  const validated: SignUpData = parseDataWithZodSchema(
    data,
    SchemaName.SIGN_UP
  );

  const { email, displayName, password } = validated;

  const params: PutItemCommandInput = {
    TableName: DbTable.USERS,
    Item: {
      userId: { S: email }, //TODO: Create User ID
      displayName: { S: displayName },
      createdAt: { S: new Date().toISOString() },
      password: { S: password }, //TODO: Hash Password
      email: { S: email },
    },
    ConditionExpression: 'attribute_not_exists(#pk)',
    ExpressionAttributeNames: {
      '#pk': 'userId',
    },
  };

  const command = new PutItemCommand(params);

  return await dynamoDb.send(command);
};
