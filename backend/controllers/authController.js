import bcrypt from 'bcryptjs';
import { body, matchedData, validationResult } from "express-validator";
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

const validateNewUser = [
    body("username").matches(/^[a-zA-Z0-9\s\-.]+$/).withMessage("Username can only contain letters, numbers, space, - and .")
        .trim()
        .isLength({ min: 3 }).withMessage("Username must have at leats 3 characteres")
        .isLength({ max: 30 }).withMessage("The maximum username length is 30")
        .custom(async value => {
            const exists = await prisma.users.findFirst({ where: { username: { equals: value.toLowerCase(), mode: 'insensitive' } } });
            if (exists)
                throw new Error('Username already in use');
            return true;
        }).withMessage("Username is already in use"),
    body("password")
        .trim()
        .isLength({ min: 3 }).withMessage("Password must have at leats 3 characteres")
        .isLength({ max: 50 }).withMessage("The maximum password length is 50"),
    body('confirmPassword').custom((value, { req }) => {
        return value === req.body.password;
    }).withMessage("Password fields must match"),
    body().custom((value, { req }) => {
        if (req.file && req.file.size > 5000000) {
            throw new Error("Maximum file size if 5MB.");
        }
        return true;
    })
];

async function checkToken(req, res) {
    try {
        jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET);
        return res.status(200).send({ success: true, valid: true });
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            console.log('Token has expired!'); // Handle expired token (e.g., prompt for refresh token)
        }
        console.log(e);
    }
}

async function getMe(req, res) {
    if (!req.user) {
        return res.status(401).send({ success: false });
    }

    try {
        const result = await prisma.users.findUnique({ where: { id: req.user.id }, omit: { password: true, picture: true } });

        if (req.user)
            return res.status(200).json({ success: true, data: result });
        return res.status(400).json({ success: false, data: undefined });
    } catch (error) {
        return next(error);
    }
}

async function login(req, res) {
    const { username, password } = req.body;
    try {
        const user = await prisma.users.findFirst({ where: { username: { equals: username.toLowerCase(), mode: 'insensitive' } } });
        if (!user) {
            return res.status(401).json({ success: false, message: "Wrong credentials" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: "Wrong credentials" });
        }

        const goOnline = await prisma.users.update({
            where: { id: user.id },
            data: { isOnline: true }
        });

        if (!goOnline) {
            return res.status(500).send({ success: false });
        }

        const meOnContacts = await prisma.contacts.findMany({
            where: { contactId: user.id },
            select: { contactOwnerId: true }
        });

        const meOnContactsIds = meOnContacts.map((item) => `user:${item.contactOwnerId}`);
        if (meOnContacts.length > 0)
            req.socketIo.to(meOnContactsIds).emit("update-status", { id: user.id, status: true });

        const payload = { id: user.id, username: user.username };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        return res.status(200).json({
            success: true,
            token: `Bearer ${token}`
        });
    } catch (err) {
        console.log(err)
    }
}

async function logOut(req, res) {
    if (!req.user) {
        return res.status(500).json({ success: false });
    }

    const userId = req.user.id;

    try {
        const user = await prisma.users.findUnique(
            { where: { id: userId } }
        );

        if (!user) {
            return res.status(500).json({ success: false });
        }

        const goOffline = await prisma.users.update({
            where: { id: user.id },
            data: { isOnline: false }
        });

        if (!goOffline) {
            return res.status(500).send({ success: false });
        }

        const meOnContacts = await prisma.contacts.findMany({
            where: { contactId: user.id },
            select: { contactOwnerId: true }
        });

        const meOnContactsIds = meOnContacts.map((item) => `user:${item.contactOwnerId}`);
        if (meOnContacts.length > 0)
            req.socketIo.to(meOnContactsIds).emit("update-status", { id: user.id, status: false });

        return res.status(200).json({
            success: true,
        });
    } catch (err) {
        console.log(err)
    }
}

const register = [
    validateNewUser,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (errors.array().length == 1 && errors.array()[0].msg == 'Username is already in use')
                return res.status(409).json({ success: false, error: errors });

            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: errors });
            }

            const hasPicture = req.file?.size > 0;

            const { username, password } = matchedData(req);
            const hashedPassword = await bcrypt.hash(password, 10);

            let userData = { username: username, password: hashedPassword };
            if (hasPicture)
                userData = { ...userData, picture: req.file.buffer, mime: req.file.mimetype };

            const result = await prisma.users.create({ data: userData });

            res.status(201).json({
                data: result,
                success: true,
            });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false });
        }
    }
];


export {
    checkToken,
    getMe,
    login,
    logOut,
    register,
}