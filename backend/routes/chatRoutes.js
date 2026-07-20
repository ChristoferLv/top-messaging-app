import { Router } from "express"
import { checkChatExistsWith, getMessageMidia, getMessageOfChat, listAllChats, listMyChats, sendFirstMessage, sendMessage } from "../controllers/chatsController.js";
import { passport } from "../authUtils.js";


const chatRoutes = Router();


import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

chatRoutes.get("/", passport.authenticate('jwt', { session: false }), listAllChats)
chatRoutes.get("/mine", passport.authenticate('jwt', { session: false }), listMyChats);
chatRoutes.get("/chatWith/:userId", passport.authenticate('jwt', { session: false }), checkChatExistsWith);
chatRoutes.post("/:chatId/messages", upload.single("midia"), passport.authenticate('jwt', { session: false }), sendMessage)
chatRoutes.post("/:userId/messages/first", upload.single("midia"), passport.authenticate('jwt', { session: false }), sendFirstMessage)
chatRoutes.get("/:chatId/messages", passport.authenticate('jwt', { session: false }), getMessageOfChat)
chatRoutes.get("/midia/:midiaId", passport.authenticate('jwt', { session: false }), getMessageMidia)

export default chatRoutes
