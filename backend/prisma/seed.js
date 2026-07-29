import { prisma } from '../lib/prisma.js';
import 'dotenv/config';
import bcrypt from 'bcryptjs';


async function main() {
  const usernames = ["user1", "user2", "user3", "user4"];
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

  await prisma.midias.deleteMany();
  await prisma.groupMidias.deleteMany();
  await prisma.messages.deleteMany();
  await prisma.chats.deleteMany();
  await prisma.usersGroups.deleteMany();
  await prisma.groupMessages.deleteMany();
  await prisma.groupChats.deleteMany();
  await prisma.contacts.deleteMany();
  await prisma.users.deleteMany();

  const defaultUsers = await prisma.$transaction(recreateUsers);

  const contacts = await prisma.contacts.createManyAndReturn({
    data: [
      { contactOwnerId: defaultUsers[0].id, contactId: defaultUsers[1].id },
      { contactOwnerId: defaultUsers[0].id, contactId: defaultUsers[2].id },
      { contactOwnerId: defaultUsers[1].id, contactId: defaultUsers[0].id },
      { contactOwnerId: defaultUsers[1].id, contactId: defaultUsers[2].id },
    ]
  });

  const chat1 = await prisma.chats.create({ data: { senderId: defaultUsers[0].id, recipientId: defaultUsers[1].id } });
  const chat2 = await prisma.chats.create({ data: { senderId: defaultUsers[0].id, recipientId: defaultUsers[2].id } });
  const chat3 = await prisma.chats.create({ data: { senderId: defaultUsers[1].id, recipientId: defaultUsers[2].id } });

  const messages = await prisma.messages.createMany({
    data: [
      { chatsId: chat1.id, content: "Hello!", senderId: defaultUsers[0].id, type: 'TEXT' },
      { chatsId: chat1.id, content: "How are you!", senderId: defaultUsers[0].id, type: 'TEXT' },
      { chatsId: chat1.id, content: "Hello!", senderId: defaultUsers[1].id, type: 'TEXT' },
      { chatsId: chat1.id, content: "Everything is ok!", senderId: defaultUsers[1].id, type: 'TEXT' },

      { chatsId: chat2.id, content: "Is the car fixed?", senderId: defaultUsers[0].id, type: 'TEXT' },
      { chatsId: chat2.id, content: "It's done at 4pm.", senderId: defaultUsers[1].id, type: 'TEXT' },

      { chatsId: chat3.id, content: "Pizza tonight?", senderId: defaultUsers[1].id, type: 'TEXT' },
      { chatsId: chat3.id, content: "Certainly", senderId: defaultUsers[2].id, type: 'TEXT' }
    ]
  });


  const group = await prisma.groupChats.create({
    data:
    {
      name: "Best group.",
      description: "Very good description",
      creatorId: defaultUsers[0].id,
    }
  });

  const userGroup = await prisma.usersGroups.createManyAndReturn({
    data: [
      { groupChatId: group.id, userId: defaultUsers[0].id },
      { groupChatId: group.id, userId: defaultUsers[1].id },
      { groupChatId: group.id, userId: defaultUsers[2].id }
    ]
  });

  const groupMessages = await prisma.groupMessages.createMany({
    data: [
      { groupChatId: group.id, senderId: defaultUsers[0].id, type: 'TEXT', content: "Welcome to this group." },
      { groupChatId: group.id, senderId: defaultUsers[1].id, type: 'TEXT', content: "Very good group." },
      { groupChatId: group.id, senderId: defaultUsers[2].id, type: 'TEXT', content: "This is the best group." },
      { groupChatId: group.id, senderId: defaultUsers[0].id, type: 'TEXT', content: "Yes, yes. This is a very good group." }
    ]
  });

  console.log('Users created:', defaultUsers);
  console.log('Contacts created:', contacts);
  console.log('Chats created:', [chat1, chat2, chat3]);
  console.log('Group created:', group);
  console.log('User to group relation created:', userGroup);
  console.log('Group messages created:', groupMessages);
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
