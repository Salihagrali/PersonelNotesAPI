import { NoteEntity } from "../entities/noteEntity.js";
import { randomUUID } from "node:crypto";
import type { Note } from "../types/note.js";
import { Service } from "electrodb";
import { TagEntity } from "../entities/tagEntity.js";
import { NoteVersionEntity } from "../entities/noteVersionEntity.js";

const MIN = "\u0000";
const MAX = "\uFFFF";

//ElectroDB Service
const NotesService = new Service({
  note: NoteEntity,
  tag : TagEntity,
  noteVersion : NoteVersionEntity
})

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

  updateContent: async (noteId: string, title: string, content: string) => {
    // Reverse lookup using GSI2.
    const lookupResult = await NoteEntity.query.byId({ id: noteId }).go();

    if(lookupResult.data.length === 0 || !lookupResult.data){
      throw new Error(`Note with id ${noteId} not found`);
    }
    // Since it is a composite sort key, we have to take the deadline as well even if 
    // we are not going to change it. This is different than the old SDK way. With SDK 
    // we directly found the SK from the lookup item. 
    const currentData = lookupResult.data[0];

    //For old notes that doesn't have version attr.
    const currentVersion = currentData.version || 1;
    
    try{
      await NotesService.transaction.write(({ note, noteVersion }) => [
            // Store old note
            noteVersion.create({
                noteId: noteId,
                version: currentVersion,
                title: currentData.title,
                content: currentData.content,
                deadline: currentData.deadline,
                tags: currentData.tags || [],
                archivedAt: new Date().toISOString(),
            }).commit(),

            // Update the note 
            note.patch({ 
                userId: currentData.userId, 
                deadline: currentData.deadline, 
                id: noteId 
            })
            .set({ 
                title, 
                content, 
                updatedAt: new Date().toISOString(),
                version: currentVersion + 1
            })
            // Couldn't find the equivalent of ConditionExpression: "attribute_exists(PK)"
            // That's why I am checking with id attribute.
            .where((attr,op) => op.exists(attr.id))
            .commit(),
        ]).go();

        return { 
            message: "Note updated and versioned", 
            id: noteId, 
            newVersion: currentVersion + 1 
        };
    }catch(err : any){
      throw new Error(`Transaction failed: ${err.message}`)
    }
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
  },

  addTag : async (noteId : string, userId : string, tag : string) => {
    const normalTag = tag.toLowerCase();

    const note = await NoteEntity.query.byId({ id: noteId }).go();
    const fetchedResults = note.data[0];

    if(!note){
      throw new Error(`Note with id ${noteId} not found`);
    }

    try {
      await NotesService.transaction.write(({ note, tag }) => [
        // Update the Note "Tags" attribute
        note.patch({ 
            userId, 
            deadline: fetchedResults.deadline, 
            id: noteId 
        })
        .add({ tags: [normalTag] }).commit(),

        // Create the Tag Entity for search.
        tag.create({
          userId,
          noteId,
          tag: normalTag,
          noteDeadline: fetchedResults.deadline,
        }).commit()
      ]).go();
    }catch(err : any){
      throw err;
    }
  },

  findByTag : async (userId : string, tag : string) => {
    const normalTag = tag.toLowerCase();
    // Don't need to specify the noteId here for the SK.
    // Only PK and the TAG SK is enough.
    // Example: PK: USER#<userId> , SK: TAG#<tag>
    // Since noteId is missing, ElectroDB aytomatically generates this:
    // PK = 'USER#<userId>' AND SK BEGINS_WITH 'TAG#<tag>'
    const tagRecords = await TagEntity.query
      .byTag({ userId, tag : normalTag }).go();

    if(tagRecords.data.length === 0) return [];

    const keys = tagRecords.data.map(item => ({
      userId : item.userId,
      id : item.noteId,
      deadline : item.noteDeadline
    }));
    // BatchGet with ElectroDB. Getting all the notes. 
    const { data } = await NoteEntity.get(keys).go();

    return data;
  },

  findNoteByVersion : async (noteId : string, version : number) => {
    const result = await NoteVersionEntity.query.byNote({noteId, version}).go();

    if(!result.data){
      throw new Error ("Note version not found");
    }
    return result.data;
  }
};