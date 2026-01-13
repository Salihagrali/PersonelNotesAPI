import { TransactWriteCommand,GetCommand,QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../config/dynamodb.js";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const TABLE_NAME = process.env.TABLE_NAME;

export interface User {
  id : string;
  email : string;
  name : string;
  createdAt : string;
}

export const UserRepository = {
  create: async (name: string, email: string): Promise<User> => {
    const userId = randomUUID();
    const timestamp = new Date().toISOString();

    const userItem = {
      PK: `USER#${userId}`,
      SK: "PROFILE", 
      GSI1PK: `EMAIL#${email}`,  
      GSI1SK: `USER#${userId}`,
      Type: "user",
      id: userId,
      name,
      email,
      createdAt: timestamp,
    };

    const emailLockItem = {
      PK: `EMAIL#${email}`,
      SK: "UNIQUE_EMAILS",
      Type: "email_lock",
      userId: userId,
      createdAt: timestamp,
    };

    try {
      await db.send(new TransactWriteCommand({
        TransactItems: [
          { Put: { 
            TableName: TABLE_NAME, 
            Item: userItem } 
          },
          { 
            Put: {
              TableName: TABLE_NAME,
              Item: emailLockItem,
              // Checks whether the pk exits or not. If exists, it'll throw an error named "ConditionalCheckFailed".
              // From: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
        ],
      }));
      
      // Destructured object.
      return { id: userId, name, email, createdAt: timestamp };

    } catch (error: any) {
      if (error.name === "TransactionCanceledException") {
        if (error.CancellationReasons?.[1]?.Code === "ConditionalCheckFailed") {
           throw new Error("Email already has been taken.");
        }
      }
      throw error;
    }
  },

  findById: async (userId: string): Promise<User | null> => {
    const result = await db.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
    }));
    // Casting Record<string, any> to User by "as" keyword.
    return (result.Item as User) || null;
  },

  findByEmail: async (email: string): Promise<User | null> => {
    const result = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: { ":email": `EMAIL#${email}` },
      // We already handled the email uniqueness. But we can't use GSI with GetComamnd.
      // That's why we need to use QueryCommand which returns an array. With Limit : 1,
      // We only get the first match.
      Limit: 1,
    }));
    // result.Items checks for undefined while result.Items[0] checks for an empty array.
    return (result.Items && result.Items[0] ? result.Items[0] as User : null);
  }
};





