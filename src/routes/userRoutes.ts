import { Hono } from "hono";
import { UserService } from "../services/userService.js";

export const userRoutes = new Hono();

// POST /users - Yeni user oluştur (email uniqueness'ı enforce et)
userRoutes.post("/", async (c) => {
  const { name, email } = await c.req.json();

  if (!name || !email) {
    return c.json({ error: "Name and email are required" }, 400);
  }

  try {
    const user = await UserService.createUser(name, email);
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
  try{
    const userId = c.req.param("id");
    const user = await UserService.getUserById(userId);
    
    return c.json(user, 200);
  }catch(err : any){
    return c.json({error : err.message},404);
  }
});

// GET /users/by-email/:email - Email'e göre user getir
userRoutes.get("/by-email/:email", async (c) => {
  try{
    const email = c.req.param("email");
    const user = await UserService.getUserByEmail(email);

    return c.json(user, 200);
  }catch(err : any){
    return c.json({error : err.message},404);
  }
});