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
                created_at: true, password: true
            }
        });

        if(!user)
            return res.status(200).send({ success: false, data: null })

        res.status(200).send({ success: true, data: user });
    } catch (e) {
        console.log(e);
    }
}


export {
    getAllUsers,
    findUserByUsername
}