# Messaging App

A WhatsApp-inspired messaging app built as penultimate project of [The Odin Project Node.js](https://www.theodinproject.com/lessons/nodejs-messaging-app) course. It combines authentication, real-time one-to-one and group chats, and media messages using Express, Prisma, and Socket.IO.

## Project Objective

The main goal was to practice:
- Building a complete messaging platform with a Node.js backend and a React frontend
- Working with authentication, authorization, and JWT-based protected routes
- Modeling a richer social app with users, contacts, chats, groups, and media messages
- Managing uploads, profile data, and group administration
- Adding real-time updates with sockets

## What is it?

A WhatsApp-inspired messaging application called WhatsUp, split into a backend API and a frontend client.

The app includes:
- User registration and login
- JWT authentication
- Contacts management
- One-to-one chats
- Group chats
- Profile editing
- User pictures and group pictures
- Text and media messages
- Online status updates
- Real-time new message notifications

## Real-Time Communication

The project uses Socket.IO for live updates between users.

This was not fully covered in the course material, so the socket implementation was researched and added independently. It is used to:
- Broadcast new messages in real time
- Update user online status
- Keep the chat experience responsive without manual refreshes

## How to Use

The project is split into two separate apps.

### Backend

1. Open the backend folder:

```bash
cd NodeJS/top-messaging-app/backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure your environment variables using `.env.example` as a reference.
4. Apply the Prisma migration:

```bash
npx prisma migrate dev
```

5. Seed the database:

```bash
npm run seed
```

6. Run the development server:

```bash
npm run dev
```

### Frontend

1. Open the frontend folder:

```bash
cd NodeJS/top-messaging-app/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the Vite development server:

```bash
npm run dev
```

4. Open the app in the browser using the local Vite address.

## Features

- **Authentication**: register, log in, and log out with protected API routes
- **Profiles**: view and edit user profiles, notes, and pictures
- **Contacts**: add and list contacts
- **One-to-one chats**: create and continue private conversations
- **Group chats**: create, edit, and manage group conversations
- **Group membership**: add members, remove members, and leave groups
- **Media messages**: send images in private chats and groups
- **Chat previews**: last message and updated timestamps in the sidebar
- **Online status**: presence updates synchronized through sockets
- **Real-time messaging**: new message events update the UI instantly

## Project Structure

- `backend/`: Express API, controllers, routes, Prisma, and Socket.IO server setup
- `frontend/`: React/Vite application, chat UI, and Socket.IO client setup

## Technologies Used

- Node.js
- Express
- PostgreSQL
- Prisma
- JWT
- Passport
- Socket.IO
- Multer
- bcryptjs
- React
- Vite
- React Router

---

>**Note on file storage:** storing uploaded files directly in the database isn't the best long-term choice for a production app, but it was a deliberate trade-off here. It keeps the project self-contained and easy for anyone to clone, run, and test without setting up external file storage.

Project developed following: [The Odin Project - Messaging App](https://www.theodinproject.com/lessons/nodejs-messaging-app)


📍 **Main repository with all projects**: [ChristoferLv/TheOdinProject](https://github.com/ChristoferLv/TheOdinProject)
