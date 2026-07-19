import 'dotenv/config';
import express, { json, urlencoded } from "express";
import { passport } from "./authUtils.js";
import authRouter from "./routes/authRoutes.js";
import { prisma } from "./lib/prisma.js";
import cors from 'cors'
import chatRoutes from './routes/chatRoutes.js';
import userRoutes from './routes/userRoutes.js';
import friendRouter from './routes/friendRoutes.js';
import jwt from 'jsonwebtoken';


import http from 'http'
import { Server } from 'socket.io'


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });
app.use(json());

const corsOptions = {
  origin: 'http://localhost:5173'
};

app.use(urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use((req, res, next) => {
  req.socketIo = io;
  next();
})

app.use((req, res, next) => {
  try {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url || req.originalUrl || 'unknown';
    console.log(`📝 ${timestamp} - ${method} ${url}`);
    console.log("   └req.body ->", req.body)
    //console.log(req.headers.cookie)
    next();
  } catch (error) {
    console.error("❌ Erro no middleware de log:", error);
    next(); // Continue mesmo com erro no log
  }
});

app.use((req, res, next) => {
  // Save a reference to the original res.send function
  const originalSend = res.send;

  // Overwrite the function to intercept the payload
  res.send = function (body) {
    console.log('--- Outgoing Response Data ---');
    console.log('------------------------------');

    // Call the original send function to complete the request
    return originalSend.apply(res, arguments);
  };

  next();
});

app.use("/chats", chatRoutes);
app.use("/contacts", friendRouter);
app.use("/users", userRoutes);
app.use("/auth", authRouter);

app.use("/", (req, res) => res.status(200).send({ message: "Ok" }))
app.use((err, req, res, next) => {
  console.log("******Global error midleware******")
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;
  console.log(err)
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected');
  console.log("sokcet info", socket.id);
  console.log("sokcet info", socket.handshake.auth);
  console.log(socket.handshake)
  var decoded = jwt.verify(socket.handshake.auth.token.split(" ")[1], process.env.JWT_SECRET);
  console.log(decoded) // bar
  socket.user = { userId: decoded.id };
  socket.join(`user:${decoded.id}`);
  // Handle new messages
  socket.on('chat message', (msg) => {
    console.log('Message received:', msg);
    console.log("sokcet info", socket.id, socket.user);
    io.to(`user:${socket.user.userId}`).emit("olha a mensagem", "user:" + socket.user.userId);
    // Broadcast the message to all connected clients
    io.emit('chat message', msg);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, (error) => {
  if (error) {
    throw error;
  }
  console.log("app listening on port 3000!");
  console.log("http://localhost:3000");
});

/*
POST https://example.com/comments HTTP/1.1
content-type: application/json

{
    "name": "sample",
    "time": "Wed, 21 Oct 2015 18:27:50 GMT"
}
    */