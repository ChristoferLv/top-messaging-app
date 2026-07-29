-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'MIDIA');

-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('NORMAL', 'GROUP');

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "password" TEXT NOT NULL,
    "note" VARCHAR(120),
    "picture" BYTEA,
    "mime" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contacts" (
    "contactOwnerId" INTEGER NOT NULL,
    "contactId" INTEGER NOT NULL,

    CONSTRAINT "Contacts_pkey" PRIMARY KEY ("contactOwnerId","contactId")
);

-- CreateTable
CREATE TABLE "Chats" (
    "id" SERIAL NOT NULL,
    "chatType" "ChatType" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,

    CONSTRAINT "Chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "id" SERIAL NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" VARCHAR(20000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" INTEGER NOT NULL,
    "chatsId" INTEGER NOT NULL,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Midias" (
    "id" SERIAL NOT NULL,
    "content" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "messageId" INTEGER NOT NULL,

    CONSTRAINT "Midias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupChats" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" VARCHAR(300),
    "picture" BYTEA,
    "mime" TEXT,
    "creatorId" INTEGER NOT NULL,
    "chatType" "ChatType" NOT NULL DEFAULT 'GROUP',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupChats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsersGroups" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupChatId" INTEGER NOT NULL,

    CONSTRAINT "UsersGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMessages" (
    "id" SERIAL NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" VARCHAR(20000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" INTEGER NOT NULL,
    "groupChatId" INTEGER NOT NULL,

    CONSTRAINT "GroupMessages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMidias" (
    "id" SERIAL NOT NULL,
    "content" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "groupMessageId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "GroupMidias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Chats_senderId_recipientId_key" ON "Chats"("senderId", "recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "Midias_messageId_key" ON "Midias"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "UsersGroups_userId_groupChatId_key" ON "UsersGroups"("userId", "groupChatId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMidias_groupMessageId_key" ON "GroupMidias"("groupMessageId");

-- AddForeignKey
ALTER TABLE "Contacts" ADD CONSTRAINT "Contacts_contactOwnerId_fkey" FOREIGN KEY ("contactOwnerId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contacts" ADD CONSTRAINT "Contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chats" ADD CONSTRAINT "Chats_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chats" ADD CONSTRAINT "Chats_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_chatsId_fkey" FOREIGN KEY ("chatsId") REFERENCES "Chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Midias" ADD CONSTRAINT "Midias_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Midias" ADD CONSTRAINT "Midias_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChats" ADD CONSTRAINT "GroupChats_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersGroups" ADD CONSTRAINT "UsersGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersGroups" ADD CONSTRAINT "UsersGroups_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "GroupChats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessages" ADD CONSTRAINT "GroupMessages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessages" ADD CONSTRAINT "GroupMessages_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "GroupChats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMidias" ADD CONSTRAINT "GroupMidias_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMidias" ADD CONSTRAINT "GroupMidias_groupMessageId_fkey" FOREIGN KEY ("groupMessageId") REFERENCES "GroupMessages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMidias" ADD CONSTRAINT "GroupMidias_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupChats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
