import { prisma } from '../lib/prisma.js';


/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function createGroup(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const userId = req.user.id;
        const groupName = req.body.name;
        const members = req.body.members;

        const contacts = await prisma.contacts.findMany({
            where: { contactOwnerId: userId },
            select: { contactId: true }
        });

        const contactsId = contacts.map((contact) => contact.contactId);

        const allMyContacts = members.every((member) => contactsId.includes(member));

        if (!allMyContacts) {
            return res.status(400).send({ success: false, message: "Not every member is on your contact list." });
        }

        const treatedMembers = members.map((participant) => {
            return { userId: participant };
        });
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
    } catch (e) {
        console.log(e);
        return res.status(500).send({ success: false });
    }
}

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function sendGroupMessage(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const groupId = parseInt(req.params.groupId);
        const userId = req.user.id;
        const message = req.body.message;
        const midiaMessage = req.file?.size > 0;

        const isMember = await prisma.usersGroups.findUnique({
            where: { userId_groupChatId: { userId: userId, groupChatId: groupId } }
        })

        if (!isMember) {
            return res.status(403).send({ success: false, message: "You are not member of this group." });
        }

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

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function getMessageOfGroup(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const userId = req.user.id;
        const groupId = parseInt(req.params.groupId);

        const isMember = await prisma.usersGroups.findUnique({
            where: { userId_groupChatId: { userId: userId, groupChatId: groupId } }
        })

        if (!isMember) {
            return res.status(403).send({ success: false, message: "You are not member of this group." });
        }

        const messages = await prisma.groupMessages.findMany({
            where: { groupChatId: groupId },
            include: {
                // chat: {include:{sender:}},
                // sender: { omit: { password: true, created_at: true, picture:true } }
                sender: { select: { id: true, username: true } }
            },
            orderBy: { created_at: 'asc' }
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
async function getGroupDetails(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const userId = req.user.id;
        const groupId = parseInt(req.params.groupId);

        const isMember = await prisma.usersGroups.findUnique({
            where: { userId_groupChatId: { userId: userId, groupChatId: groupId } }
        })

        if (!isMember) {
            return res.status(403).send({ success: false, message: "You are not member of this group." });
        }

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
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const userId = req.user.id;
        const groupId = parseInt(req.params.groupId);
        const memberId = parseInt(req.params.memberId);

        const group = await prisma.groupChats.findUnique({
            where: { id: groupId },
            include: {
                usersGroups: true
            },
        });

        if (!group) {
            return res.status(400).send({ success: false, message: "Group not found." });
        }

        if (group.creatorId != userId) {
            return res.status(400).send({ success: false, message: "You do now own this group." });
        }

        if (memberId == group.creatorId) {
            return res.status(400).send({ success: false, message: "Cannot remove group creator." });
        }

        const isMember = await prisma.usersGroups.findUnique({
            where: {
                userId_groupChatId: {
                    userId: memberId,
                    groupChatId: groupId
                }
            }
        });

        if (!isMember) {
            return res.status(400).send({ success: false, message: "This user is not member of this group." });
        }

        const resultRemove = await prisma.usersGroups.delete({
            where: { userId_groupChatId: { userId: memberId, groupChatId: groupId } }
        });

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
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const groupId = parseInt(req.params.groupId);
        const userId = req.user.id;
        const group = await prisma.groupChats.findUnique({
            where: { id: groupId },
        });

        if (!group)
            return res.status(400).send({ success: false, message: "Group not found" });

        if (group.creatorId != userId) {
            return res.status(400).send({ success: false, message: "You do now own this group." });
        }

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
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const groupId = parseInt(req.params.groupId);
        const memberId = parseInt(req.params.memberId);
        const group = await prisma.groupChats.findUnique({
            where: { id: groupId },
            include: {
                usersGroups: true
            },
        });

        if (!group) {
            return res.status(400).send({ success: false, message: "Group not Found" });
        }

        if (group.creatorId != userId) {
            return res.status(400).send({ success: false, message: "You do now own this group." });
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