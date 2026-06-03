import 'dotenv/config'


import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';


async function seedSpecialUsers() {
  await prisma.specialUser.upsert({
    where: {
      email: 'suman132j@gmail.com',
    },
    update: {
      role: UserRole.ADMIN,
    },
    create: {
      email: 'suman132j@gmail.com',
      role: UserRole.ADMIN,
    },
  });

  await prisma.specialUser.upsert({
    where: {
      email: 'velocium.iot@gmail.com',
    },
    update: {
      role: UserRole.FACULTY,
    },
    create: {
      email: 'velocium.iot@gmail.com',
      role: UserRole.FACULTY,
    },
  });
}

async function main() {
  await seedSpecialUsers();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });