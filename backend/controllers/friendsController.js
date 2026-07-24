import { prisma } from '../lib/prisma.js';

async function listMyContacts(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const userId = req.user.id;

        const result = await prisma.contacts.findMany({
            where: { contactOwnerId: userId },
            include: {
                contact: {
                    omit: { password: true, created_at: true, picture: true }
                }
            }
        });

        if (!result)
            return res.status(500).send({ success: false });

        return res.send({ success: true, data: result });
    } catch (e) {
        console.log(e)
        throw e;
    }
}

async function addContact(req, res) {
    try {
        const userId = req.user.id;
        const contactId = req.body.id;

        if (userId == contactId) {
            return res.status(400).send({ success: false, message: "Cannot add yourself to the contact list." });
        }

        const exists = await prisma.users.findUnique({
            where: { id: userId }
        });

        if (!exists) {
            return res.status(400).send({ success: false, message: "User not found." });
        }

        const alreadyFriend = await prisma.contacts.findUnique({
            where: { contactOwnerId_contactId: { contactId: contactId, contactOwnerId: userId } }
        });

        if (alreadyFriend) {
            return res.status(400).send({ success: false, message: "You already have this user on the contact list." });
        }

        const result = await prisma.contacts.create({
            data: {
                contactOwnerId: userId,
                contactId: contactId
            }
        })

        if (!result)
            return res.status(500).send({ success: false });

        return res.send({ success: true, data: result });
    } catch (e) {
        console.log(e);
        return res.status(500).send({ success: false });
    }
}


export {
    listMyContacts,
    addContact
}