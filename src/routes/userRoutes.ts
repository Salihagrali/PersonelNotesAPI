import { Hono } from "hono";
import { UserRepository } from "../repositories/userRepository.js";

export const userRoutes = new Hono();

// POST /users - Yeni user oluştur (email uniqueness'ı enforce et)
userRoutes.post("/", async (c) => {
  const { name, email } = await c.req.json();

  if (!name || !email) {
    return c.json({ error: "Name and email are required" }, 400);
  }

  try {
    const user = await UserRepository.create(name, email);
    return c.json(user, 201);
  } catch (error: any) {
    if(error.message === "Email already has been taken."){
      return c.json("Email already has been taken.", 400)
    }
    return c.json({ error: error.message }, 500);
  }
});

// GET /users/:id - ID'ye göre user getir
userRoutes.get("/:id", async (c) => {
  const userId = c.req.param("id");
  const user = await UserRepository.findById(userId);

  if(!user){
    return c.json({ error: "User not found" }, 404);
  }
  return c.json(user, 200);
});

// GET /users/by-email/:email - Email'e göre user getir
userRoutes.get("/by-email/:email", async (c) => {
  const email = c.req.param("email");
  const user = await UserRepository.findByEmail(email);

  if(!user){
    return c.json({error : "User not found "} ,404);
  }
  return c.json(user,200);
});