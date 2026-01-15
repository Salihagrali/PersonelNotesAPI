import { STATUS_CODES } from "http";
import { NoteRepository } from "../repositories/noteRepository.js";
import { AppError } from "../utils/appError.js";

export const NoteService = {
  createNote : async (userId: string, title: string, content: string, deadline: string) => {
    if(new Date(deadline) < new Date()){
      throw new AppError("Deadline cannot be in the past.", 400);
    }
    return await NoteRepository.create(userId, title, content, deadline);
  },

  getAllNotes : async (userId: string) => {
    return await NoteRepository.findAllByUser(userId);
  },

  getNotesDueBefore : async (userId: string, date: string) => {
    return await NoteRepository.findDueBefore(userId, date);
  },

  getNotesDueAfter : async (userId: string, date: string) => {
    return await NoteRepository.findDueAfter(userId, date);
  },

  updateNote : async (noteId: string, title: string, content: string) => {
    if (!title && !content) {
            throw new AppError("At least one field must be provided",400);
    }
    try {
      return await NoteRepository.updateContent(noteId, title, content);
    } catch (error: any) {
      if (error.message.includes("not found")) {
                throw new AppError("Note not found", 404);
      }
      throw error; 
    }
  },

  deleteNote : async (noteId: string) => {
    const success = await NoteRepository.delete(noteId);
    //if (!success) {
    //  throw new AppError("Note not found", 404);
    //}
    return success;
  }
}