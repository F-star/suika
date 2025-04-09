import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  const user1 = await prisma.user.upsert({
    where: { username: 'user-a' },
    update: {},
    create: {
      username: 'user-a',
      password: 'ABCD', // TODO: use bcrypt
    },
  });

  const post1 = await prisma.file.create({
    data: {
      title: 'this is file A',
      body: 'this is file a body',
      description: 'description',
      published: false,
      authorId: user1.id,
    },
  });

  const post2 = await prisma.file.create({
    data: {
      title: 'this is file B',
      body: 'this is file b body',
      description: 'description',
      published: true,
      authorId: user1.id,
    },
  });

  console.log({ user1, post1, post2 });
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
