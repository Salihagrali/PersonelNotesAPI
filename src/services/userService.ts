import { UserRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/appError.js";


export const UserService = {
  createUser : async (name: string, email: string) => {
    return await UserRepository.create(name, email);
  },

  getUserById : async (userId: string) => {
    const user = await UserRepository.findById(userId);
    if(!user){
      throw new AppError("User not found with userID: " + userId,404);
    }
    return user;
  },

  getUserByEmail : async (email: string) => {
    const user = await UserRepository.findByEmail(email);
    if(!user){
      throw new AppError("User not found with email: " + email,404);
    }
    return user;
  }
}