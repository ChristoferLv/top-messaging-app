import { prisma } from '../lib/prisma.js';
import 'dotenv/config';
import bcrypt from 'bcryptjs';


async function main() {
  const usernames = ["user1", "user2", "user3"];
  const password = "pass";
  const hashedPassword = await bcrypt.hash(password, 10);

  const recreateUsers = usernames.map((user) => {
    return prisma.users.upsert({
      where: { username: user },
      update: {},
      create: {
        username: user,
        password: hashedPassword,
      },
    });
  });

  const defaultUsers = await prisma.$transaction(recreateUsers);

  // const defaultChat = await prisma.chats.create({ data: { senderId: result[0].id, recipientId: result[1].id } });

  const defaultChat = await prisma.chats.upsert({ where: { senderId_recipientId: { senderId: defaultUsers[0].id, recipientId: defaultUsers[1].id } }, update: {}, create: { senderId: defaultUsers[0].id, recipientId: defaultUsers[1].id } });

  await prisma.messages.deleteMany();

  const defaultMessage1 = await prisma.messages.create({ data: { chatsId: defaultChat.id, senderId: defaultUsers[0].id, content: "The first message." } });
  const defaultMessage2 = await prisma.messages.create({ data: { chatsId: defaultChat.id, senderId: defaultUsers[1].id, content: "The second message" } });

  console.log('Default users created:', defaultUsers);
  console.log('Default chat created:', defaultChat);
  console.log('Default messages created:', [defaultMessage1, defaultMessage2]);
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
