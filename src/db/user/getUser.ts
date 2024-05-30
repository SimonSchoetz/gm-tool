import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { dynamoDb } from '../dynamoDb';

export const getUser = async (email: string) => {
  const params = {
    TableName: 'Users',
    Key: { userId: { S: email } },
  };

  const command = new GetItemCommand(params);
  return await dynamoDb.send(command);
};
