import 'server-only';

import { GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { dynamoDb } from '../dynamoDb';
import { DbTable } from '@/enums';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { User } from '@/types/user';
import { assertIsZodSchemaBasedType } from '@/util/asserts';
import { SchemaName } from '@/schemas/util';
import { cache } from 'react';

export const getUser = cache(async (email: string): Promise<User> => {
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

  assertIsZodSchemaBasedType<User>(user, SchemaName.USER);

  return getUserDTO(user);
});

const getUserDTO = (user: User): User => {
  // taintUniqueValue(
  //   'Do not expose password hash to client',
  //   user,
  //   user.passwordHash
  // );
  // taintUniqueValue(
  //   'Do not expose email verification state to client',
  //   user,
  //   user.emailVerified
  // );
  return user;
};
