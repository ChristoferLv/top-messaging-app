import { Router } from "express";
import { findUserByUsername, getAllUsers, getPicture, uploadPicture } from "../controllers/usersController.js";
import { passport } from "../authUtils.js";

import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });


const userRoutes = Router();


userRoutes.get("/", getAllUsers);
userRoutes.get("/find/:username", findUserByUsername);
userRoutes.get("/picture/:userId", passport.authenticate('jwt', { session: false }), getPicture);
userRoutes.post("/picture", upload.single("picture"), passport.authenticate('jwt', { session: false }), uploadPicture);

export default userRoutes;