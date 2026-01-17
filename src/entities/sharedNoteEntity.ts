import { Entity } from "electrodb";
import { db } from "../config/dynamodb.js";
import dotenv from "dotenv";

dotenv.config();

const TABLE_NAME = process.env.TABLE_NAME;

export const SharedNoteEntity = new Entity(
  {
    model: {
      entity: "shared_note",
      version: "1",
      service: "notes_app",
    },
    attributes: {
      noteId: { type: "string", required: true },
      sharedWith : {type : "string", required : true},
      sharedBy : {type : "string", required : true},
      sharedAt : {type : "string" , required : true},
      noteDeadline: { type: "string", required: true }
    },
    indexes : {
      byUser : {
        pk : {
          field : "PK",
          composite : ["sharedWith"],
          template : "USER#${sharedWith}",
        },
        sk : {
          field: "SK",
          composite: ["noteId"],
          template: "SHARED#${noteId}",
        }
      },
      byNote : {
        index : "GSI2",
        pk : {
          field : "GSI2PK",
          composite : ["noteId"],
          template : "NOTE#${noteId}"
        },
        sk : {
          field : "GSI2SK",
          composite: ["sharedWith"],
          template: "SHARED#${sharedWith}",
        }
      },
    },
  },
  { client: db, table: TABLE_NAME }
)
  
