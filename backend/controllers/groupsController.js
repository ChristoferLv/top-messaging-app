import { prisma } from '../lib/prisma.js';


/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function createGroup(req, res) {
    const userId = req.user.id;
    const groupName = req.body.name;
    const members = req.body.members;

    const treatedMembers = members.map((participant) => {
        return { userId: participant };
    })

    treatedMembers.push({ userId: userId });

    const result = await prisma.groupChats.create({
        data: {
            name: groupName,
            creatorId: userId,
            type: 'GROUP',
            usersGroups: {
                createMany: {
                    data: treatedMembers
                }
            }
        }
    })
    return res.status(201).send({ success: true, data: result });
}

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function sendGroupMessage(req, res) {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.id;
    const message = req.body.message;
    const midiaMessage = req.file?.size > 0;
    console.log("content", req.body)

    try {
        let fileRef = null;
        let result = null;
        const sendMessageResult = await prisma.$transaction(async (tx) => {
            const group = await tx.groupChats.findUnique({
                where: { id: groupId }
            });

            if (!group)
                return res.status(400).send({ success: false, message: "Group not found" });

            const updateGroupResult = await tx.groupChats.update(
                {
                    where: { id: groupId },
                    data: { updated_at: new Date() }
                },
            );


            if (midiaMessage) {
                result = await tx.groupMessages.create({
                    data: {
                        content: "Midia",
                        groupChatId: groupId,
                        senderId: userId,
                        type: 'MIDIA',
                    }
                });
            } else {
                result = await tx.groupMessages.create({
                    data: {
                        content: message,
                        groupChatId: groupId,
                        senderId: userId,
                        type: 'TEXT'
                    }
                });
            }

            if (midiaMessage) {
                const fileData = new Buffer.from(req.file.buffer).toString('base64');
                const mime = req.file.mimetype;

                fileRef = await tx.groupMidias.create(
                    {
                        data: {
                            content: `${mime}:${fileData}`,
                            ownerId: userId,
                            groupMessageId: result.id,
                            groupId: groupId,
                        }
                    }
                )
            }


            // const receiver = chat.recipientId == userId ? chat.senderId : chat.recipientId;
            // console.log("receiver", receiver)
            // if (result) {
            // req.socketIo.to(`user:${receiver}`).emit("olha a mensagem", "chat:" + chat.id);
            // }
            if (midiaMessage) {
                const { reducedFileRef, content } = fileRef;
                return { ...result, midia: reducedFileRef };
            }
            return result;
        }
        );
        return res.status(201).send({ success: true, data: sendMessageResult });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}

//  const chatId = parseInt(req.params.chatId);
//     console.log(req.file)
//     console.log(req.body)
//     const midiaMessage = req.file?.size > 0;
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

//             const message = req.body.message;
//             const userId = req.user.id;

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

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function getMessageOfGroup(req, res) {
    const groupId = parseInt(req.params.groupId);
    console.log("groupid", groupId)
    try {
        const messages = await prisma.groupMessages.findMany({
            where: { groupChatId: groupId },
            include: {
                // chat: {include:{sender:}},
                // sender: { omit: { password: true, created_at: true, picture:true } }
                sender: { select: { id: true, username: true } }
            },
            orderBy: { created_at: 'asc' }
        });
        console.log("group messages", messages)
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
async function getGroupDetails(req, res) {
    const groupId = parseInt(req.params.groupId);
    try {
        const details = await prisma.groupChats.findUnique({
            where: { id: groupId },
            include: {
                creator: { select: { id: true, username: true } },
                usersGroups: { select: { user: { select: { id: true, username: true } } } }
            },
        });
        res.status(200).send({ success: true, data: details });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function removeMemberFromGroup(req, res) {
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);
    try {
        const group = await prisma.groupChats.findUnique({
            where: { id: groupId },
            include: {
                usersGroups: true
            },
        });

        const relationToRemove = group.usersGroups.filter((relation) => relation.userId == memberId);

        if (relationToRemove[0].id == group.creatorId) {
            return res.status(400).send({ success: false, message: "Cannot remove group creator." });
        }

        const resultRemove = await prisma.usersGroups.delete({
            where: { id: relationToRemove[0].id }
        });

        console.log("result", resultRemove)

        if (resultRemove) {
            return res.status(200).send({ success: true });
        }
        return res.status(500).send({ success: false });

    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}

async function editGroup(req, res) {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.id;
    try {
        const group = await prisma.groupChats.findUnique({
            where: { id: groupId },
        });

        if (!group)
            return res.status(400).send({ success: false, message: "Group not found" });

        const result = await prisma.groupChats.update({
            where: { id: groupId },
            data: {
                description: req.body.description,
                name: req.body.name
            }
        })

        if (result) {
            return res.status(200).send({ success: true });
        }
        return res.status(500).send({ success: false });

    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function addMemberToGroup(req, res) {
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);
    try {
        const group = await prisma.groupChats.findUnique({
            where: { id: groupId },
            include: {
                usersGroups: true
            },
        });

        if (!group) {
            return res.status(400).send({ success: false, message: "Group not Found" });
        }

        const user = await prisma.users.findUnique({
            where: { id: memberId },
        });

        if (!user) {
            return res.status(400).send({ success: false, message: "User not Found" });
        }

        const resultAdd = await prisma.usersGroups.create({
            data: {
                groupChatId: groupId,
                userId: memberId
            }
        })

        if (resultAdd) {
            return res.status(200).send({ success: true, data: resultAdd });
        }
        return res.status(500).send({ success: false });

    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}


export {
    createGroup,
    getMessageOfGroup,
    sendGroupMessage,
    getGroupDetails,
    removeMemberFromGroup,
    addMemberToGroup,
    editGroup
}