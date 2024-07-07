import 'server-only';

import {
  PutItemCommand,
  PutItemCommandInput,
  PutItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
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

  const params: PutItemCommandInput = {
    TableName: DbTable.USERS,
    Item: marshall({
      email,
      userContentId: generateId(),
      createdAt: new Date().toISOString(),
      passwordHash: await encryptPassword(password),
    }),
    ConditionExpression: 'attribute_not_exists(#pk)',
    ExpressionAttributeNames: {
      '#pk': 'email',
    },
  };

  const command = new PutItemCommand(params);

  return await dynamoDb.send(command);
};
