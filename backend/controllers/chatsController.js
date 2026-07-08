import { prisma } from '../lib/prisma.js';

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function listAllChats(req, res) {
    try {
        const chats = await prisma.chats.findMany();
        res.status(200).send({ success: true, data: chats });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function checkChatExistsWith(req, res) {
    const userId = req.user.id;
    const receiverId = parseInt(req.params.userId);
    try {
        const chat = await prisma.chats.findFirst({
            where: {
                OR: [
                    { recipientId: userId, senderId: receiverId },
                    { recipientId: receiverId, senderId: userId }
                ]
            }
        });
        if (!chat)
            res.status(200).send({ success: true, isChat: false });
        res.status(200).send({ success: true, isChat: true, data: chat });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function listMyChats(req, res) {
    const userId = req.user.id;
    try {
        const chats = await prisma.$queryRaw`
        SELECT "Chats".id as "chatId", updated_at, sender.id as "userId", sender.username
        FROM "Chats"
        INNER JOIN "Users" as sender ON "Chats"."senderId" = ${userId} AND sender.id = "Chats"."recipientId"
        UNION
        SELECT "Chats".id as "chatId", updated_at, receiver.id as "userId", receiver.username
        FROM "Chats"
        INNER JOIN "Users" as receiver ON "Chats"."recipientId" = ${userId} AND receiver.id = "Chats"."senderId"
        ORDER BY updated_at DESC
        `

        res.status(200).send({ success: true, data: chats });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}


/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function sendFirstMessage(req, res) {
    const userId = req.user.id;
    const receiverId = parseInt(req.params.userId);

    try {
        const chat = await prisma.chats.findFirst({
            where: {
                OR: [
                    { recipientId: userId, senderId: receiverId },
                    { recipientId: receiverId, senderId: userId }
                ]
            }
        });

        if (chat)
            res.status(409).send({ success: false, data: chat });

        const message = req.body.message;


        const firstMessageResult = await prisma.$transaction(async (tx) => {
            const newChat = await tx.chats.create({
                data: {
                    recipientId: receiverId,
                    senderId: userId
                }
            });

            const firstMessage = await tx.messages.create(
                {
                    data: {
                        content: message,
                        senderId: userId,
                        chatsId: newChat.id
                    }
                }
            );
            return { chat: newChat, message: firstMessage };
        });




        // const firstMessageResult = await prisma.$transaction([newChat, firstMessage]);
        console.log(firstMessageResult)

        res.status(201).send({ success: true, data: firstMessageResult });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function sendMessage(req, res) {
    const chatId = parseInt(req.params.chatId);
    try {
        const chat = await prisma.chats.findUnique({
            where: { id: chatId }
        });
        if (!chat)
            return res.status(300).send({ success: false, message: "Chat not found" });

        console.log(req.body)
        const message = req.body.message;
        const userId = req.user.id;

        const result = await prisma.messages.create({
            data: {
                content: message,
                chatsId: chat.id,
                senderId: userId,

            }
        });
        res.status(201).send({ success: true, data: result });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function getMessageOfChat(req, res) {
    const chatId = parseInt(req.params.chatId);
    try {
        const messages = await prisma.messages.findMany({
            where: { chatsId: chatId },
            include: {
                chat: true,
                sender: { omit: { password: true, created_at: true } }
            },
            orderBy: { created_at: 'asc' }
        });

        if (messages.length == 0)
            return res.status(404).send({
                success: false,
                message: "Chat not found"
            });

        res.status(200).send({ success: true, data: messages });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}


export {
    listAllChats,
    listMyChats,
    sendMessage,
    getMessageOfChat,
    checkChatExistsWith,
    sendFirstMessage
}