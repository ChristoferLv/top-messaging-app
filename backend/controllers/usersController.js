import { prisma } from "../lib/prisma.js";

async function getAllUsers(req, res) {
    try {
        const users = await prisma.users.findMany({
            omit: {
                created_at: true, password: true
            }
        });

        res.status(200).send({ success: true, data: users });
    } catch (e) {
        console.log(e);
    }
}

async function findUserByUsername(req, res) {
    const { username } = req.params;
    try {
        const user = await prisma.users.findUnique({
            where: { username: username },
            omit: {
                password: true, picture: true
            }
        });

        if (!user)
            return res.status(200).send({ success: false, data: null })

        res.status(200).send({ success: true, data: user });
    } catch (e) {
        console.log(e);
    }
}

async function getUserById(req, res) {
    const userId = parseInt(req.params.userId);
    try {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            omit: {
                password: true, picture: true
            }
        });

        if (!user)
            return res.status(200).send({ success: false, data: null })

        res.status(200).send({ success: true, data: user });
    } catch (e) {
        console.log(e);
    }
}

async function updateUserProfile(req, res) {
    const userId = parseInt(req.user.id);
    const note = req.body.note;
    try {
        const user = await prisma.users.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(400).send({ success: false });
        }

        const result = await prisma.users.update({
            where: { id: userId },
            data: { note: note },
            omit: { password: true, picture: true }
        })

        return res.status(200).send({ success: true, data: result });
    } catch (e) {
        console.log(e);
    }
}

async function getPicture(req, res) {
    const userId = parseInt(req.params.userId);
    const result = await prisma.users.findUnique(
        { where: { id: userId }, select: { picture: true } }
    );
    res.status(200).send({ success: true, data: result.picture });
}

async function uploadPicture(req, res) {
    console.log(req.body)
    const userId = req.user.id;
    const content = new Buffer.from(req.file.buffer).toString('base64');
    const mime = req.file.mimetype;
    const result = await prisma.users.update(
        {
            data: { picture: `${mime}:${content}` },
            where: { id: userId }
        }
    );
    return res.status(201).send({ success: true, data: result.picture });
}


export {
    getAllUsers,
    findUserByUsername,
    getUserById,
    updateUserProfile,
    getPicture,
    uploadPicture
}