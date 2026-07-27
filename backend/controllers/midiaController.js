import { prisma } from '../lib/prisma.js';

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
async function getMessageMidia(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    const messageId = parseInt(req.params.messageId);
    const origin = req.params.origin;
    try {
        if (origin.toLowerCase() == "group") {
            const result = await prisma.groupMidias.findUnique({
                where: { groupMessageId: messageId },
            });

            if (!result)
                return res.status(404).send({
                    success: false,
                });

            let newbuffer = null;
            if (result.content)
                newbuffer = Buffer.from(result.content, result.content.byteOffset, result.content.byteLength)
            const response = { ...result, content: newbuffer };
            return res.status(200).send({ success: true, data: { ...result, content: newbuffer } });
        } else {
            const result = await prisma.midias.findUnique({
                where: { messageId: messageId },
            });

            if (!result)
                return res.status(404).send({
                    success: false,
                });

            let newbuffer = null;
            if (result.content)
                newbuffer = Buffer.from(result.content, result.content.byteOffset, result.content.byteLength)
            const response = { ...result, content: newbuffer };
            return res.status(200).send({ success: true, data: { ...result, content: newbuffer } });
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false });
    }
}


export {
    getMessageMidia
}