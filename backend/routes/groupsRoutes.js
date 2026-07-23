import { Router } from "express";
import { addMemberToGroup, createGroup, editGroup, getGroupDetails, getMessageOfGroup, removeMemberFromGroup, sendGroupMessage } from "../controllers/groupsController.js";
import { passport } from "../authUtils.js";

import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });


const groupRouter = Router();

groupRouter.post("/", passport.authenticate('jwt', { session: false }), createGroup);
groupRouter.get("/:groupId/details", passport.authenticate('jwt', { session: false }), getGroupDetails);
groupRouter.put("/:groupId", passport.authenticate('jwt', { session: false }), editGroup);
groupRouter.get("/:groupId/messages", passport.authenticate('jwt', { session: false }), getMessageOfGroup);
groupRouter.post("/:groupId/messages", upload.single("midia"), passport.authenticate('jwt', { session: false }), sendGroupMessage);
groupRouter.delete("/:groupId/members/:memberId",  passport.authenticate('jwt', { session: false }), removeMemberFromGroup);
groupRouter.post("/:groupId/members/:memberId", passport.authenticate('jwt', { session: false }), addMemberToGroup);


export default groupRouter;