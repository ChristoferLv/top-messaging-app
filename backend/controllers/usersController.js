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


export {
    getAllUsers
}