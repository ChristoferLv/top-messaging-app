import { Router } from "express";
import { findUserByUsername, getAllUsers } from "../controllers/usersController.js";


const userRoutes = Router();


userRoutes.get("/", getAllUsers);
userRoutes.get("/find/:username", findUserByUsername);

export default userRoutes;