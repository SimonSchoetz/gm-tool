import 'server-only';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
import { parsedEnv } from '@/util/helper';

dotenv.config();

export const dynamoDb = new DynamoDBClient({
  region: parsedEnv.AWS_DYNAMODB_REGION,
  credentials: {
    accessKeyId: parsedEnv.AWS_DYNAMODB_ACCESS_KEY,
    secretAccessKey: parsedEnv.AWS_DYNAMODB_SECRET_KEY,
  },
});
