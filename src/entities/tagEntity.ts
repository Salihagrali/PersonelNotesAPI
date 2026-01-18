import { Entity } from "electrodb";
import { db } from "../config/dynamodb.js";
import dotenv from "dotenv";

dotenv.config();

const TABLE_NAME = process.env.TABLE_NAME;

export const TagEntity = new Entity(
  {
    model: { entity: "tag", version: "1", service: "notes_app" },
    attributes: {
      userId: { type: "string", required: true },
      noteId: { type: "string", required: true },
      tag: { type: "string", required: true },
      // Needed to look up the actual Note later
      noteDeadline: { type: "string", required: true }, 
    },
    indexes: {
      byTag: {
        pk: { 
          field: "PK", 
          composite: ["userId"], 
          template: "USER#${userId}" 
        },
        sk: { 
          field: "SK", 
          composite: ["tag", "noteId"], 
          template: "TAG#${tag}#NOTE#${noteId}" 
        },
        },
      },
  },
  { client: db, table: TABLE_NAME }
);

