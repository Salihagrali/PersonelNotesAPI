import { Entity } from "electrodb";
import { db } from "../config/dynamodb.js";
import dotenv from "dotenv";

dotenv.config();

const TABLE_NAME = process.env.TABLE_NAME;

export const NoteEntity = new Entity(
  {
    model: {
      entity: "note",
      version: "1",
      service: "notes_app",
    },
    attributes: {
      id: { type: "string", required: true },
      userId: { type: "string", required: true },
      title: { type: "string", required: true },
      content: { type: "string" },
      deadline: { type: "string", required: true },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
      tags : {
        type : "set",
        items : "string",
        default : []
      },
      version: { 
        type: "number", 
        required: true, 
        default: 1 
      }
    },
    indexes: {
      byUser: {
        pk: {
          field: "PK",
          composite: ["userId"],
          template: "USER#${userId}",
        },
        sk: {
          field: "SK",
          composite: ["deadline", "id"],
          template: "NOTE#${deadline}#${id}",
        },
      },
      //Reverse lookup (GSI)
      byId: {
        index: "GSI2",
        pk: {
          field: "GSI2PK",
          composite: ["id"],
          template: "NOTE#${id}",
        },
        sk: {
          field: "GSI2SK",
          composite: ["userId"],
          template: "USER#${userId}",
        },
      },
    },
  },
  { client: db, table: TABLE_NAME }
);