import { prisma } from '../lib/prisma.js';


/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function createGroup(req, res) {
    const userId = req.user.id;
    const groupName = req.body.name;
    const participants = req.body.participants;

    const treatedParticipants = participants.map((participant) => {
        return { userId: participant };
    })

    const result = await prisma.groupChats.create({
        data: {
            name: groupName,
            creatorId: userId,
            type: 'GROUP',
            usersGroups: {
                createMany: {
                    data: treatedParticipants
                }
            }
        }
    })
    return res.status(201).send({success:true, data:result});
}

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function sendGroupMessage(req, res) {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.id;
    const message = req.body.content;

    try {
        const sendMessageResult = await prisma.$transaction(async (tx) => {
            const group = await tx.groupChats.findUnique({
                where: { id: groupId }
            });

            if (!group)
                return res.status(300).send({ success: false, message: "Group not found" });

            const updateGroupResult = await tx.groupChats.update(
                {
                    where: { id: groupId },
                    data: { updated_at: new Date() }
                },
            );

            const messageResult = await tx.groupMessages.create({
                data: {
                    content: message,
                    type: 'TEXT',
                    groupChatsId: groupId,
                    sender: userId,
                }
            });
            return messageResult;
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
    const groupId = parseInt(req.params.groupId);
    try {
        const messages = await prisma.groupMessages.findMany({
            where: { id: groupId },
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


export {
    createGroup,
    getMessageOfGroup,
    sendGroupMessage
}