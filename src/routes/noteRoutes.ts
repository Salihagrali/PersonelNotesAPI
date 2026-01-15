import { Hono } from "hono";
import { NoteService } from "../services/noteService.js";

export const noteRoutes = new Hono();

// POST /users/:userId/notes - Bir user için note oluştur
noteRoutes.post("/users/:userId/notes", async (c) => {
  const userId = c.req.param("userId");
  const { title, content, deadline } = await c.req.json();

  try {
    const note = await NoteService.createNote(userId, title, content, deadline);
    return c.json(note, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// GET /users/:userId/notes - Bir user'ın tüm notlarını getir
noteRoutes.get("/users/:userId/notes", async (c) => {
  const userId = c.req.param("userId");
  const notes = await NoteService.getAllNotes(userId);
  return c.json(notes, 200);
});

// GET /users/:userId/notes/due-before/:date - Belirli bir tarihten önce deadline'ı olan notları getir
noteRoutes.get("/users/:userId/notes/due-before/:date", async (c) => {
  const userId = c.req.param("userId");
  const date = c.req.param("date");
  
  const notes = await NoteService.getNotesDueBefore(userId, date);
  return c.json(notes, 200);
});

// GET /users/:userId/notes/due-after/:date - Belirli bir tarihten sonra deadline'ı olan notları getir
noteRoutes.get("/users/:userId/notes/due-after/:date", async (c) => {
  const userId = c.req.param("userId");
  const date = c.req.param("date");
  
  const notes = await NoteService.getNotesDueAfter(userId, date);
  return c.json(notes, 200);
});

// PUT /notes/:id - Note güncelle
noteRoutes.put("/notes/:id", async (c) => {
  try{
    const noteId = c.req.param("id");
    const { title, content } = await c.req.json();

    const updatedNote = await NoteService.updateNote(noteId, title, content);
    return c.json(updatedNote, 200);
  } catch(err: any){
    return c.json({error : err.message},404);
  }
});

// DELETE /notes/:id - Note sil
noteRoutes.delete("/notes/:id", async (c) => {
  const noteId = c.req.param("id");
  const success = await NoteService.deleteNote(noteId);
  if (success) {
    return c.json({ message: "Note deleted successfully" }, 200);
  } else {
    return c.json({ error: "Note not found" }, 404);
  }
});