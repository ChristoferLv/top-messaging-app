import { Router } from "express";
import { createGroup } from "../controllers/groupsController.js";
import { passport } from "../authUtils.js";




const groupRouter = Router();

groupRouter.post("/", passport.authenticate('jwt', { session: false }), createGroup);



export default groupRouter;