import { prisma } from '../lib/prisma.js';

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function getMessageMidia(req, res) {
    const messageId = parseInt(req.params.messageId);
    const origin = req.params.origin;
    try {
        if (origin.toLowerCase() == "group") {
            const content = await prisma.groupMidias.findUnique({
                where: { groupMessageId: messageId},
            });

            if (!content)
                return res.status(404).send({
                    success: false,
                });

            res.status(200).send({ success: true, data: content });
        } else {
            const content = await prisma.midias.findUnique({
                where: { messageId: messageId },
            });

            if (!content)
                return res.status(404).send({
                    success: false,
                });

            return res.status(200).send({ success: true, data: content });
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}


export {
    getMessageMidia
}