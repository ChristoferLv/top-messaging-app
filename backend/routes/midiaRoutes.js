import { Router } from "express";
import { getMessageMidia } from "../controllers/midiaController.js";


const pictureRouter = Router();

pictureRouter.get("/:origin/:messageId", getMessageMidia)



export default pictureRouter;