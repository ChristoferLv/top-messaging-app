import { Router } from "express"
import { checkChatExistsWith, getMessageOfChat, listAllChats, listMyChats, sendFirstMessage, sendMessage } from "../controllers/chatsController.js";
import { passport } from "../authUtils.js";


const chatRoutes = Router();

chatRoutes.get("/", passport.authenticate('jwt', { session: false }), listAllChats)
chatRoutes.get("/mine", passport.authenticate('jwt', { session: false }), listMyChats);
chatRoutes.get("/chatWith/:userId", passport.authenticate('jwt', { session: false }), checkChatExistsWith);
chatRoutes.post("/:chatId/messages", passport.authenticate('jwt', { session: false }), sendMessage)
chatRoutes.post("/:userId/messages/first", passport.authenticate('jwt', { session: false }), sendFirstMessage)
chatRoutes.get("/:chatId/messages", passport.authenticate('jwt', { session: false }), getMessageOfChat)

export default chatRoutes
