import { UserRole } from '@prisma/client';
import prisma from '../src/lib/prisma';

async function seedSpecialUser() {
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
  await seedSpecialUser();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });