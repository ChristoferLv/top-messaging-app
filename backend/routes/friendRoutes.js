import { Router } from 'express'
import { passport } from "../authUtils.js";
import { addContact, listMyContacts } from '../controllers/friendsController.js';



const friendRouter = Router();

friendRouter.post("/",passport.authenticate('jwt', { session: false }), addContact);
friendRouter.get("/",passport.authenticate('jwt', { session: false }), listMyContacts);

export default friendRouter;