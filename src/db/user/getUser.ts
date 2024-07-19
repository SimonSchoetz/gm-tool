import 'server-only';

import { GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { dynamoDb } from '../dynamoDb';
import { DbTable } from '@/enums';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { User } from '@/types/user';
import { assertByZodSchema } from '@/util/asserts';
import { SchemaName } from '@/schemas/util';

export const getUser = async (email: string): Promise<User> => {
  const params: GetItemCommandInput = {
    TableName: DbTable.USERS,
    Key: marshall({ email }),
  };

  const command = new GetItemCommand(params);

  const commandOutput = await dynamoDb.send(command);

  if (!commandOutput.Item) {
    throw new Error(`User not found: ${email}`);
  }
  const user = unmarshall(commandOutput.Item);

  assertByZodSchema<User>(user, SchemaName.USER);

  return user;
};
