import { randomUUID } from "node:crypto";
import type { User } from "../types/user.js";
import { Service } from "electrodb";
import { UserEntity } from "../entities/userEntity.js";
import { ConstraintEntity } from "../entities/constraintEntity.js";

const NotesService = new Service({
  user : UserEntity,
  emailLock : ConstraintEntity
})

export const UserRepository = {
  create: async (name: string, email: string): Promise<User> => {
    const userId = randomUUID();
    const timestamp = new Date().toISOString();

    const result = await NotesService.transaction
      .write(({ user, emailLock }) => [
        user.create({
          id: userId,
          name,
          email,
          createdAt: timestamp,
        }).commit(),
      
        emailLock.create({
          lockKey: `EMAIL#${email}`,
          userId,
          createdAt: timestamp,
        }).commit(),
      ])
      .go();

    const emailLockResult = result.data[1];
          
    if (emailLockResult.rejected) {
      if (emailLockResult.code === "ConditionalCheckFailed") {
        throw new Error("Email already has been taken.");
      }
    
      throw new Error(emailLockResult.message ?? "Transaction failed");
    }

    return { id: userId, name, email, createdAt: timestamp };
  },

  findById: async (userId: string): Promise<User | null> => {
    const result = await UserEntity.get({"id" : userId}).go();
    return result.data as User || null;
  },

  findByEmail: async (email: string): Promise<User | null> => {
    const result = await UserEntity.query.byEmail({ email }).go();
    return result.data[0] as User || null;
  }
};





