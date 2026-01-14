import { PutCommand, QueryCommand, DeleteCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../config/dynamodb.js";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const TABLE_NAME = process.env.TABLE_NAME;

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  deadline: string;
  createdAt: string;
}

export const NoteRepository = {
  
  create: async (userId: string, title: string, content: string, deadline: string): Promise<Note> => {
    // Provides unique id
    const noteId = randomUUID();
    const now = new Date().toISOString();

    const noteItem = {
      PK: `USER#${userId}`,
      SK: `NOTE#${deadline}#${noteId}`, // Composite sort key pattern deadline for sorting noteId for uniqueness
      GSI2PK: `NOTE#${noteId}`, // Needed for reverse lookup access pattern. 
      GSI2SK: `USER#${userId}`,
      Type: "note",
      id: noteId,
      userId,
      title,
      content,
      deadline,
      createdAt: now,
      updatedAt: now
    };

    await db.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: noteItem
    }));

    return { id: noteId, userId, title, content, deadline, createdAt: now };
  },

  findAllByUser: async (userId: string): Promise<Note[]> => {
    const result = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":skPrefix": "NOTE#", // Get anything that starts with NOTE#
      },
    }));

    return (result.Items as Note[]) || [];
  },

  findDueBefore: async (userId: string, date: string): Promise<Note[]> => {
    const result = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK < :dateLimit",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        // Date = deadline. We need to follow the ISO-861 for the dates. 
        // DynamoDB compares strings and ISO-861 strings preserve chronological order.
        ":dateLimit": `NOTE#${date}`,
      },
    }));
    return (result.Items as Note[]) || [];
  },

  findDueAfter: async (userId: string, date: string): Promise<Note[]> => {
    const result = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK > :dateLimit",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":dateLimit": `NOTE#${date}`,
      },
    }));
    return (result.Items as Note[]) || [];
  },

  updateContent: async (noteId: string, title: string, content: string): Promise<void> => {
    // First we find the full keys because we have only the noteId.
    // In here we implement the reverse lookup with GSI.
    const lookupResult = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :noteId",
      ExpressionAttributeValues: {
        ":noteId": `NOTE#${noteId}`,
      },
      Limit: 1,
    }));

    if (!lookupResult.Items || lookupResult.Items.length === 0) {
      throw new Error(`Note with id ${noteId} not found`);
    }
    const note = lookupResult.Items[0];
    const { PK, SK } = note; // We have the both PK and SK.

    await db.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK, SK },
      UpdateExpression: "SET title = :t, content = :c, updatedAt = :u",
      // To avoid race condition with delete() method.
      ConditionExpression: "attribute_exists(PK)",
      ExpressionAttributeValues: {
        ":t": title,
        ":c": content,
        ":u": new Date().toISOString(),
      },
    }));
  },
  
  delete: async (noteId: string): Promise<boolean> => {
    // Same logic with the updateContent method
    const lookupResult = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :noteId",
      ExpressionAttributeValues: {
        ":noteId": `NOTE#${noteId}`,
      },
      Limit: 1,
    }));

    if (!lookupResult.Items || lookupResult.Items.length === 0) {
      return false;
    }

    const note = lookupResult.Items[0];
    const { PK, SK } = note; // We have the both PK and SK.

    await db.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK, SK },
    }));

    return true;
  }
};