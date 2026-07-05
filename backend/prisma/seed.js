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

  const result = await prisma.$transaction(recreateUsers);

  console.log('Default users created:', result)
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
