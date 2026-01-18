import { Entity } from "electrodb";
import { db } from "../config/dynamodb.js";
import dotenv from "dotenv";

dotenv.config();

const TABLE_NAME = process.env.TABLE_NAME;

export const NoteVersionEntity = new Entity(
  {
    model: { entity: "note_version", version: "1", service: "notes_app" },
    attributes: {
      noteId: { type: "string", required: true },
      // Previous data of the note
      title: { type: "string", required: true },
      content: { type: "string" },
      deadline: { type: "string", required: true },
      tags: { type: "set", items: "string" },
      // Metadata
      version: { type: "number", required: true },
      archivedAt: { type: "string", required: true },
    },
    indexes: {
      byNote: {
        pk: {
          field: "PK",
          composite: ["noteId"],
          template: "NOTE_HISTORY#${noteId}",
        },
        sk: {
          field: "SK",
          composite: ["version"],
          template: "VER#${version}",
        },
      },
    },
  },
  { client: db, table: TABLE_NAME }
);