import { body, matchedData, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";

const validateNote = [
    body("note")
        .trim()
        .isLength({ max: 200 }).withMessage("The maximum length for notes is 200 characters.")
];

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
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    const { username } = req.params;
    try {
        const user = await prisma.users.findUnique({
            where: { username: username },
            omit: {
                password: true, picture: true
            }
        });

        if (!user)
            return res.status(400).send({ success: false, message: "No contact found with requested username." })

        res.status(200).send({ success: true, data: user });
    } catch (e) {
        console.log(e);
    }
}

async function getUserById(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    };

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

const updateUserProfile = [
    validateNote,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors });
        }

        if (!req.user) {
            return res.status(401).send({ success: false });
        }

        const note = matchedData(req).note;
        const userId = parseInt(req.user.id);

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
];

async function getPicture(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    const userId = parseInt(req.params.userId);
    const result = await prisma.users.findUnique(
        { where: { id: userId }, select: { picture: true, mime:true } }
    );
    let newbuffer = null;
    if (result.picture)
        newbuffer = Buffer.from(result.picture, result.picture.byteOffset, result.picture.byteLength)

    res.status(200).send({ success: true, data: { buffer: newbuffer, mime: result.mime } });
}

async function uploadPicture(req, res) {
    try {

        const userId = req.user.id;
        const mime = req.file.mimetype;

        if (!mime.startsWith("image/"))
            return res.status(400).send({ success: false, message: "Invalid file type." });

        if (req.file.size > 5000000) {
            return res.status(400).send({ success: false, message: "Maximum picture file size is 5MB." });
        }

        const result = await prisma.users.update(
            {
                data: { picture: req.file.buffer, mime: mime },
                where: { id: userId }
            }
        );
        let newbuffer = null;
        if (result.picture)
            newbuffer = Buffer.from(result.picture, result.picture.byteOffset, result.picture.byteLength)
        return res.status(201).send({ success: true, data: newbuffer });
    } catch (e) {
        console.log(e);
        return res.status(500).send({ success: false });
    }
}


export {
    getAllUsers,
    findUserByUsername,
    getUserById,
    updateUserProfile,
    getPicture,
    uploadPicture
}