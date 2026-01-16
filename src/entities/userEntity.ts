import { Entity } from "electrodb";
import { db } from "../config/dynamodb.js";
import dotenv from "dotenv";

dotenv.config();

const TABLE_NAME = process.env.TABLE_NAME;

export const UserEntity = new Entity(
  {
    model: {
      entity: "user",
      version: "1",
      service: "notes_app",
    },
    // No need to include PK,SK or GSIs here. Only the attributes,
    attributes: {
      id: { type: "string", required: true },
      email: { type: "string", required: true },
      name: { type: "string", required: true },
      createdAt: { type: "string", required: true },
    },
    // PK,SK and GSIs will be defined here.
    indexes: {
      byId: {
        pk: {
          field: "PK",
          composite: ["id"],
          //We need to use templates on an existing tables. 
          //From doc : https://electrodb.dev/en/modeling/indexes/#composite-attribute-templates
          template: "USER#${id}",
        },
        sk: {
          field: "SK",
          composite: [],
          template: "PROFILE",
        },
      },
      byEmail: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["email"],
          template: "EMAIL#${email}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["id"],
          template: "USER#${id}",
        },
      },
    },
  },
  { client: db, table: TABLE_NAME }
);