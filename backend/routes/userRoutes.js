import { Router } from "express";
import { getAllUsers } from "../controllers/usersController.js";


const userRoutes = Router();


userRoutes.get("/", getAllUsers);

export default userRoutes;