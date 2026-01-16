import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

// Loads environment variables from .env
dotenv.config();

//Environment Variables
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if(!region || !accessKeyId || !secretAccessKey){
  throw new Error("Missing AWS credentials in .env");
}

console.log(`Connecting to DynamoDB in: ${region}`);

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  }
});

export const db = DynamoDBDocumentClient.from(client);