import 'server-only';

import {
  UpdateItemCommand,
  UpdateItemCommandInput,
  UpdateItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { dynamoDb } from '../dynamoDb';
import { DbTable } from '@/enums';
import { User } from '@/types/user';

export const updateUser = async (
  email: string,
  updates: Partial<User> // Specify only the fields that need updating
): Promise<UpdateItemCommandOutput> => {
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, string> = {};
  let updateExpression = 'SET';

  Object.keys(updates).forEach((key, index) => {
    const attributeKey = `#attr${index}`;
    const valueKey = `:val${index}`;

    expressionAttributeNames[attributeKey] = key;
    expressionAttributeValues[valueKey] = updates[key as keyof User]!;

    if (index > 0) updateExpression += ',';
    updateExpression += ` ${attributeKey} = ${valueKey}`;
  });

  const params: UpdateItemCommandInput = {
    TableName: DbTable.USERS,
    Key: marshall({ email }),
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: marshall(expressionAttributeValues),
    ReturnValues: 'ALL_NEW', // Return the updated user item
  };

  const command = new UpdateItemCommand(params);
  return await dynamoDb.send(command);
};
