import 'server-only';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

// Load environment variables
console.log('env:', process.env.AWS_DYNAMODB_REGION);
//@ts-ignore
export const dynamoDb = new DynamoDBClient({
  region: process.env.AWS_DYNAMODB_REGION,
  credentials: {
    accessKeyId: process.env.AWS_DYNAMODB_ACCESS_KEY,
    secretAccessKey: process.env.AWS_DYNAMODB_SECRET_KEY,
  },
});
