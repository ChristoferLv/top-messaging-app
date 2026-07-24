import { body, matchedData, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';

const validateMessage = [
    body("message")
        .trim()
        .custom((value, { req }) => {
            if (req.file && req.file.size > 5000000) {
                throw new Error("Maximum file size if 5MB.");
            }
            if (!req.file && value.length < 1)
                throw new Error("Minimum message length is 1 character.");
            return true;
        })
        .isLength({ max: 20000 }).withMessage("The maximum message length is 20000 characters.")
        // .isLength({ min: 1 }).withMessage("Minimum message length is 1 character.")
];



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
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const userId = req.user.id;
        const receiverId = parseInt(req.params.userId);
        const user = await prisma.users.findUnique({
            where: { id: receiverId },
            omit: { picture: true, password: true }
        });

        const chat = await prisma.chats.findFirst({
            where: {
                OR: [
                    { recipientId: userId, senderId: receiverId },
                    { recipientId: receiverId, senderId: userId }
                ]
            }
        });
        if (!chat)
            return res.status(200).send({ success: true, isChat: false, data: { user: user, chat: null } });
        return res.status(200).send({ success: true, isChat: true, data: { user: user, chat: chat } });
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
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const userId = req.user.id;
        const chats = await prisma.$queryRaw`
        SELECT "Chats".id as "chatId", updated_at, sender.id as "id", sender.username, 'NORMAL' as "chatType"
        FROM "Chats"
        INNER JOIN "Users" as sender ON "Chats"."senderId" = ${userId} AND sender.id = "Chats"."recipientId"
        UNION
        SELECT "Chats".id as "chatId", updated_at, receiver.id as "id", receiver.username, 'NORMAL' as "chatType"
        FROM "Chats"
        INNER JOIN "Users" as receiver ON "Chats"."recipientId" = ${userId} AND receiver.id = "Chats"."senderId"
        
        `
        const lastMessageOfChatPromises = chats.map((chat) => {
            return prisma.messages.findFirst(
                {
                    where: { chatsId: chat.chatId },
                    orderBy: { created_at: 'desc' }
                }
            )
        });

        const lastMessageOfChat = await Promise.all(lastMessageOfChatPromises);

        const chatsData = chats.map((chat, idx) => {
            return { ...chat, lastMessage: lastMessageOfChat[idx] };
        })

        const groups = await prisma.$queryRaw`
        SELECT "GroupChats".id as "groupId", updated_at, null as "userId", "GroupChats"."name" as "username", 'GROUP' as "chatType"
        FROM "GroupChats"
        INNER JOIN "UsersGroups" ON "GroupChats".id = "groupChatId"
        WHERE "UsersGroups"."userId" = ${userId}

        ORDER BY updated_at DESC
        `

        const lastMessageOfGroupsPromises = groups.map((group) => {
            return prisma.groupMessages.findFirst(
                {
                    where: { groupChatId: group.id },
                    orderBy: { created_at: 'desc' },
                }
            )
        });

        const lastMessageOfGroups = await Promise.all(lastMessageOfGroupsPromises);

        const groupsData = groups.map((group, idx) => {
            return { ...group, lastMessage: lastMessageOfGroups[idx] };
        })

        res.status(200).send({ success: true, data: [...chatsData, ...groupsData] });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}


const sendFirstMessage = [
    validateMessage,
    async (req, res) => {
        if (!req.user) {
            return res.status(401).send({ success: false });
        }

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors });
        }

        const userId = req.user.id;
        const receiverId = parseInt(req.params.userId);
        const midiaMessage = req.file?.size > 0;
        const message = matchedData(req).message;
        let fileRef = null;
        let result = null;

        if (midiaMessage && req.file.size > 5000000) {
            return res.status(400).send({ success: false, message: "Maximum midia size is 5MB." });
        }

        try {
            const friend = await prisma.contacts.findUnique({
                where: { contactOwnerId_contactId: { contactOwnerId: userId, contactId: receiverId } }
            });

            if (!friend)
                return res.status(403).send({ success: false, message: "This user is not on your contacts list." });

            const chat = await prisma.chats.findFirst({
                where: {
                    OR: [
                        { recipientId: userId, senderId: receiverId },
                        { recipientId: receiverId, senderId: userId }
                    ]
                }
            });

            if (chat)
                return res.status(409).send({ success: false, data: chat, message: "You already have a chat with this user." });

            const firstMessageResult = await prisma.$transaction(async (tx) => {
                const newChat = await tx.chats.create({
                    data: {
                        recipientId: receiverId,
                        senderId: userId
                    }
                });

                if (midiaMessage) {
                    result = await tx.messages.create({
                        data: {
                            content: "Midia",
                            chatsId: newChat.id,
                            senderId: userId,
                            type: 'MIDIA'
                        }
                    });
                } else {
                    result = await tx.messages.create({
                        data: {
                            content: message,
                            chatsId: newChat.id,
                            senderId: userId,
                            type: 'TEXT'
                        }
                    });
                }

                if (midiaMessage) {
                    const fileData = new Buffer.from(req.file.buffer).toString('base64');
                    const mime = req.file.mimetype;

                    fileRef = await tx.midias.create(
                        {
                            data: {
                                content: `${mime}:${fileData}`,
                                ownerId: userId,
                                messageId: result.id,
                            }
                        }
                    )
                }

                const user = await prisma.users.findUnique({
                    where: { id: receiverId },
                    omit: { picture: true, password: true }
                });

                const newChatData = { user: user, chat: newChat }
                const receiver = receiverId;

                if (result) {
                    req.socketIo.to(`user:${receiver}`).emit("olha a mensagem", "chat:" + newChat.id);
                }

                return newChatData;
            });

            res.status(201).send({ success: true, data: firstMessageResult });
        } catch (e) {
            console.log(e);
            res.status(500).send({ success: false });
        }

    }
]


// /**
//  * @param {import('express').Request} req - The Express request object.
//  * @param {import('express').Response} res - The Express response object.
//  */
// async function sendFirstMessage(req, res) {
//     const userId = req.user.id;
//     const receiverId = parseInt(req.params.userId);
//     const midiaMessage = req.file?.size > 0;
//     const message = req.body.message;
//     let fileRef = null;
//     let result = null;

//     if (midiaMessage && req.file.size > 5000000) {
//         return res.status(400).send({ success: false, message: "Maximum midia size is 5MB." });
//     }

//     if (message.length > 20000) {
//         return res.status(400).send({ success: false, message: "Maximum message length is 20000 characters." });
//     }

//     try {
//         const chat = await prisma.chats.findFirst({
//             where: {
//                 OR: [
//                     { recipientId: userId, senderId: receiverId },
//                     { recipientId: receiverId, senderId: userId }
//                 ]
//             }
//         });

//         if (chat)
//             res.status(409).send({ success: false, data: chat });



//         const firstMessageResult = await prisma.$transaction(async (tx) => {
//             const newChat = await tx.chats.create({
//                 data: {
//                     recipientId: receiverId,
//                     senderId: userId
//                 }
//             });

//             if (midiaMessage) {
//                 result = await tx.messages.create({
//                     data: {
//                         content: "Midia",
//                         chatsId: newChat.id,
//                         senderId: userId,
//                         type: 'MIDIA'
//                     }
//                 });
//             } else {
//                 result = await tx.messages.create({
//                     data: {
//                         content: message,
//                         chatsId: newChat.id,
//                         senderId: userId,
//                         type: 'TEXT'
//                     }
//                 });
//             }

//             if (midiaMessage) {
//                 const fileData = new Buffer.from(req.file.buffer).toString('base64');
//                 const mime = req.file.mimetype;

//                 fileRef = await tx.midias.create(
//                     {
//                         data: {
//                             content: `${mime}:${fileData}`,
//                             ownerId: userId,
//                             messageId: result.id,
//                         }
//                     }
//                 )
//             }

//             const user = await prisma.users.findUnique({
//                 where: { id: receiverId },
//                 omit: { picture: true, password: true }
//             });

//             const newChatData = { user: user, chat: newChat }
//             console.log("new chat data", newChatData)
//             const receiver = receiverId;
//             console.log("receiver", receiver)
//             if (result) {
//                 req.socketIo.to(`user:${receiver}`).emit("olha a mensagem", "chat:" + newChat.id);
//             }
//             // if (midiaMessage) {
//             //     const { reducedFileRef, content } = fileRef;
//             //     return { ...result, midia: reducedFileRef };
//             // }
//             return newChatData;

//             // const firstMessage = await tx.messages.create(
//             //     {
//             //         data: {
//             //             content: message,
//             //             senderId: userId,
//             //             chatsId: newChat.id
//             //         }
//             //     }
//             // );
//             // return { chat: newChat, message: firstMessage };
//         });




//         // const firstMessageResult = await prisma.$transaction([newChat, firstMessage]);
//         // console.log(firstMessageResult)

//         res.status(201).send({ success: true, data: firstMessageResult });
//     } catch (e) {
//         console.log(e);
//         res.status(500).send({ success: false });
//     }
// }


const sendMessage = [
    validateMessage,
    async (req, res) => {
        if (!req.user) {
            return res.status(401).send({ success: false });
        }

        // console.log("body", req.file)

        const errors = validationResult(req);
        console.log("errors", errors)
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors });
        }

        const chatId = parseInt(req.params.chatId);
        const midiaMessage = req.file?.size > 0;
        const userId = req.user.id;
        const message = matchedData(req).message;

        if (midiaMessage && req.file.size > 5000000) {
            return res.status(400).send({ success: false, message: "Maximum midia size is 5MB." });
        }

        try {
            const chat = await prisma.chats.findUnique({
                where: { id: chatId }
            });

            if (!chat)
                return res.status(400).send({ success: false, message: "Chat not found." });

            if (chat.recipientId != userId && chat.senderId != userId) {
                return res.status(403).send({ success: false, message: "You do not have access to this chat." });
            }

            let fileRef = null;
            let result = null;
            const sendMessageResult = await prisma.$transaction(async (tx) => {
                const chat = await tx.chats.findUnique({
                    where: { id: chatId }
                });

                if (!chat)
                    return res.status(400).send({ success: false, message: "Chat not found" });

                const updateChatResult = await tx.chats.update(
                    {
                        where: { id: chat.id },
                        data: { updated_at: new Date() }
                    },
                );

                if (midiaMessage) {
                    result = await tx.messages.create({
                        data: {
                            content: "Midia",
                            chatsId: chat.id,
                            senderId: userId,
                            type: 'MIDIA'
                        }
                    });
                } else {
                    result = await tx.messages.create({
                        data: {
                            content: message,
                            chatsId: chat.id,
                            senderId: userId,
                            type: 'TEXT'
                        }
                    });
                }

                if (midiaMessage) {
                    const fileData = new Buffer.from(req.file.buffer).toString('base64');
                    const mime = req.file.mimetype;

                    fileRef = await tx.midias.create(
                        {
                            data: {
                                content: `${mime}:${fileData}`,
                                ownerId: userId,
                                messageId: result.id,
                            }
                        }
                    )
                }

                const receiver = chat.recipientId == userId ? chat.senderId : chat.recipientId;
                console.log("receiver", receiver)
                if (result) {
                    req.socketIo.to(`user:${receiver}`).emit("olha a mensagem", "chat:" + chat.id);
                }
                if (midiaMessage) {
                    const { reducedFileRef, content } = fileRef;
                    return { ...result, midia: reducedFileRef };
                }
                return result;
            });

            res.status(201).send({ success: true, data: sendMessageResult });
        } catch (e) {
            console.log(e);
            res.status(500).send({ success: false });
        }
    }
]

// /**
//  * @param {import('express').Request} req - The Express request object.
//  * @param {import('express').Response} res - The Express response object.
//  */
// async function sendMessage(req, res) {
//     const chatId = parseInt(req.params.chatId);
//     console.log(req.file)
//     console.log(req.body)
//     const midiaMessage = req.file?.size > 0;
//     const message = req.body.message;
//     const userId = req.user.id;

//     if (midiaMessage && req.file.size > 5000000) {
//         return res.status(400).send({ success: false, message: "Maximum midia size is 5MB." });
//     }

//     if (message.length > 20000) {
//         return res.status(400).send({ success: false, message: "Maximum message length is 20000 characters." });
//     }

//     try {
//         let fileRef = null;
//         let result = null;
//         const sendMessageResult = await prisma.$transaction(async (tx) => {
//             const chat = await tx.chats.findUnique({
//                 where: { id: chatId }
//             });

//             if (!chat)
//                 return res.status(300).send({ success: false, message: "Chat not found" });

//             const updateChatResult = await tx.chats.update(
//                 {
//                     where: { id: chat.id },
//                     data: { updated_at: new Date() }
//                 },
//             );


//             if (midiaMessage) {
//                 result = await tx.messages.create({
//                     data: {
//                         content: "Midia",
//                         chatsId: chat.id,
//                         senderId: userId,
//                         type: 'MIDIA'
//                     }
//                 });
//             } else {
//                 result = await tx.messages.create({
//                     data: {
//                         content: message,
//                         chatsId: chat.id,
//                         senderId: userId,
//                         type: 'TEXT'
//                     }
//                 });
//             }

//             if (midiaMessage) {
//                 const fileData = new Buffer.from(req.file.buffer).toString('base64');
//                 const mime = req.file.mimetype;

//                 fileRef = await tx.midias.create(
//                     {
//                         data: {
//                             content: `${mime}:${fileData}`,
//                             ownerId: userId,
//                             messageId: result.id,
//                         }
//                     }
//                 )
//             }


//             const receiver = chat.recipientId == userId ? chat.senderId : chat.recipientId;
//             console.log("receiver", receiver)
//             if (result) {
//                 req.socketIo.to(`user:${receiver}`).emit("olha a mensagem", "chat:" + chat.id);
//             }
//             if (midiaMessage) {
//                 const { reducedFileRef, content } = fileRef;
//                 return { ...result, midia: reducedFileRef };
//             }
//             return result;
//         });




//         res.status(201).send({ success: true, data: sendMessageResult });
//     } catch (e) {
//         console.log(e);
//         res.status(500).send({ success: false });
//     }
// }

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function getMessageOfChat(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    const userId = parseInt(req.user.id);
    const chatId = parseInt(req.params.chatId);

    const chat = await prisma.chats.findUnique({
        where: { id: chatId }
    });

    if (!chat)
        return res.status(400).send({ success: false, message: "Chat not found." });

    if (chat.recipientId != userId && chat.senderId != userId) {
        return res.status(403).send({ success: false, message: "You do not have access to this chat." });
    }

    try {
        const messages = await prisma.messages.findMany({
            where: { chatsId: chatId },
            include: {
                // chat: {include:{sender:}},
                // sender: { omit: { password: true, created_at: true, picture:true } }
                sender: { select: { id: true } }
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

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function getMessageMidia(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    const userId = req.user.id;
    const midiaId = parseInt(req.params.midiaId);
    try {
        const content = await prisma.midias.findUnique({
            where: { messageId: midiaId },
            include: { message: { include: { chat: true } } }
        });

        if (content.message.chat.recipientId != userId && content.message.chat.senderId) {
            return res.status(403).send({ success: false, message: "You do not have access to this midia." });
        }

        if (!content)
            return res.status(404).send({
                success: false,
            });

        res.status(200).send({ success: true, data: content });
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
    sendFirstMessage,
    getMessageMidia
}