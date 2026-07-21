import { Router } from "express";
import { getUserById, findUserByUsername, getAllUsers, getPicture, uploadPicture, updateUserProfile } from "../controllers/usersController.js";
import { passport } from "../authUtils.js";

import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });


const userRoutes = Router();


userRoutes.get("/", passport.authenticate('jwt', { session: false }), getAllUsers);
userRoutes.get("/:userId", passport.authenticate('jwt', { session: false }), getUserById);
userRoutes.put("/", passport.authenticate('jwt', { session: false }), updateUserProfile);
userRoutes.get("/find/:username", passport.authenticate('jwt', { session: false }), findUserByUsername);
userRoutes.get("/picture/:userId", passport.authenticate('jwt', { session: false }), getPicture);
userRoutes.post("/picture", upload.single("picture"), passport.authenticate('jwt', { session: false }), uploadPicture);

export default userRoutes;