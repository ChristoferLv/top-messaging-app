import { Router } from "express";
import { createGroup, getMessageOfGroup, sendGroupMessage } from "../controllers/groupsController.js";
import { passport } from "../authUtils.js";

import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });


const groupRouter = Router();

groupRouter.post("/", passport.authenticate('jwt', { session: false }), createGroup);
groupRouter.get("/:groupId/messages", passport.authenticate('jwt', { session: false }), getMessageOfGroup);
groupRouter.post("/:groupId/messages", upload.single("midia"), passport.authenticate('jwt', { session: false }), sendGroupMessage);


export default groupRouter;