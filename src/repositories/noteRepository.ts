import { NoteEntity } from "../entities/noteEntity.js";
import { randomUUID } from "node:crypto";
import type { Note } from "../types/note.js";

const MIN = "\u0000";
const MAX = "\uFFFF";

export const NoteRepository = {
  
  create: async (userId: string, title: string, content: string, deadline: string): Promise<Note> => {
    // Provides unique id
    const noteId = randomUUID();
    const now = new Date().toISOString();

    const noteItem = await NoteEntity.create({
      id : noteId,
      userId,
      title,
      content,
      deadline,
      createdAt: now,
      updatedAt: now,
    }).go();

    return noteItem.data as Note;
  },

  findAllByUser: async (userId: string): Promise<Note[]> => {
    // RAW SDK (OLD WAY):
    // We had to manually write the query logic and know the SK structure.
    // Example: KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)"
    
    // ELECTRODB (NEW WAY):
    // We just call .byUser({ userId }).
    // ElectroDB automatically generates the "PK = ..." and "begins_with..." logic 
    // based on the Entity definition we created.
    const result = await NoteEntity.query.byUser({ userId }).go();
    return result.data as Note[];
  },

  findDueBefore: async (userId: string, date: string): Promise<Note[]> => {
    //No need for BETWEEN anymore. ElectroDB handles the sort key comparison automatically.
    const result = await NoteEntity.query.byUser({ userId }).lt({ "deadline": date, "id" : MAX}).go()
    return result.data as Note[];
  },

  findDueAfter: async (userId: string, date: string): Promise<Note[]> => {
    const result = await NoteEntity.query.byUser({ userId }).gt({ "deadline": date, "id" : MIN}).go()
    return result.data as Note[];
  },

  updateContent: async (noteId: string, title: string, content: string): Promise<Note> => {
    // Reverse lookup using GSI2.
    const lookupResult = await NoteEntity.query.byId({ id: noteId }).go();

    if(lookupResult.data.length === 0 || !lookupResult.data){
      throw new Error(`Note with id ${noteId} not found`);
    }
    // Since it is a composite sort key, we have to take the deadline as well even if 
    // we are not going to change it. This is different than the old SDK way. With SDK 
    // we directly found the SK from the lookup item. 
    const { userId, deadline, id } = lookupResult.data[0];
    
    const result = await NoteEntity.patch({ userId, deadline,id})
      .set({ title, content ,updatedAt: new Date().toISOString()})
      // Couldn't find the equivalent of ConditionExpression: "attribute_exists(PK)"
      // That's why I am checking with id attribute.
      .where((attr,op) => op.exists(attr.id) )
      .go({response : "all_new"});

    return result.data as Note;
  },
  
  delete: async (noteId: string): Promise<boolean> => {
    // Same logic with the updateContent method
    const lookupResult = await NoteEntity.query.byId({ id: noteId }).go();

    if (!lookupResult.data || lookupResult.data.length === 0) {
      return false;
    } 
    const { userId, deadline, id } = lookupResult.data[0];

    await NoteEntity.delete({ userId, deadline, id }).go();
    
    return true;
  }
};