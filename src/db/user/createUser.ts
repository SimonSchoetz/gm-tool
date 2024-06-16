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
import { encryptPassword } from '@/util/encryption';
import { generateId } from '@/util/helper';

export const createUser = async (
  data: SignUpData
): Promise<PutItemCommandOutput> => {
  const validated: SignUpData = parseDataWithZodSchema(
    data,
    SchemaName.SIGN_UP
  );

  const { email, password } = validated;
  const passwordHash = await encryptPassword(password);

  const params: PutItemCommandInput = {
    TableName: DbTable.USERS,
    Item: {
      userId: { S: generateId() },
      createdAt: { S: new Date().toISOString() },
      password: { S: passwordHash },
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
