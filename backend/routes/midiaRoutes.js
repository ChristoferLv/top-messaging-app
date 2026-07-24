import { Router } from "express";
import { getMessageMidia } from "../controllers/midiaController.js";
import { passport } from "../authUtils.js"


const pictureRouter = Router();

pictureRouter.get("/:origin/:messageId", passport.authenticate('jwt', { session: false }), getMessageMidia)



export default pictureRouter;