import { Entity } from "electrodb";
import { db } from "../config/dynamodb.js";
import dotenv from "dotenv";

dotenv.config();

const TABLE_NAME = process.env.TABLE_NAME;

export const ConstraintEntity = new Entity(
  {
    model: { entity: "constraint", version: "1", service: "notes_app" },
    attributes: {
      // We manually handle the PK to prevent an 'email' column from being created
      lockKey: { 
        type: "string", 
        required: true, 
        field: "PK"
      },
      userId: { type: "string", required: true },
      createdAt: { type: "string", required: true },
      Type: { type: "string", default: "email_lock", readOnly: true },
    },
    indexes: {
      constraint: {
        pk: {
          field: "PK", 
          composite: ["lockKey"], 
          template: "${lockKey}",
        },
        sk: {
          field: "SK",
          composite: [],
          template: "UNIQUE_EMAILS",
        },
      },
    },
  },
  { table: TABLE_NAME, client: db }
);