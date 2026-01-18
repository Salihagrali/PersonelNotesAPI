import { NoteEntity } from "../entities/noteEntity.js";
import { SharedNoteEntity } from "../entities/sharedNoteEntity.js";

export const SharedNoteRepository ={
  share : async (ownerId : string, noteId : string, sharedWith : string) => {
    const noteResult = await NoteEntity.query.byId({ id: noteId }).go();
    const note = noteResult.data[0];

    if (!note) {
      throw new Error(`Note with id ${noteId} not found`);
    }

    // Notes already have userIds so for now we don't need to check for user authenticity.
    const result = await SharedNoteEntity.create({
      noteId: noteId,
      sharedWith: sharedWith,
      sharedBy: ownerId,
      sharedAt: new Date().toISOString(),
      noteDeadline: note.deadline,
    }).go();

    return result.data;
  },

  getSharedWithMe : async (userId : string) => {
    const sharedNotes = await SharedNoteEntity.query.byUser({sharedWith : userId}).go();

    if(sharedNotes.data.length === 0){
      return [];
    }
    // All the PK and SKs has to be in the keys otherwise won't work.
    const noteKeys = sharedNotes.data.map((share) => ({
      userId: share.sharedBy,
      id: share.noteId,
      deadline : share.noteDeadline
    }));
    // BatchGet with ElectroDB. Getting all the notes. 
    const { data } = await NoteEntity.get(noteKeys).go();

    return data;
  },

  getNoteAccessList : async (noteId : string) => {
    const result = await SharedNoteEntity.query.byNote({noteId : noteId}).go();
    //Only show the userIds.
    return result.data.map((s) =>s.sharedWith);
  }
}