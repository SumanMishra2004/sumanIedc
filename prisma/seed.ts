import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a faculty special user
  const facultySpecialUser = await prisma.specialUser.upsert({
    where: { email: 'faculty@example.com' },
    update: { role: 'FACULTY' },
    create: {
      email: 'faculty@example.com',
      role: 'FACULTY',
    },
  })
  console.log('✅ Created special user:', facultySpecialUser)

  // Create a teacher special user
  const teacherSpecialUser = await prisma.specialUser.upsert({
    where: { email: 'teacher@example.com' },
    update: { role: 'TEACHER' },
    create: {
      email: 'teacher@example.com',
      role: 'TEACHER',
    },
  })
  console.log('✅ Created special user:', teacherSpecialUser)

  // Create an initial faculty user with credentials
  const hashedPassword = await bcrypt.hash('password123', 10)
  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty@example.com' },
    update: {
      role: 'FACULTY',
      password: hashedPassword,
    },
    create: {
      email: 'faculty@example.com',
      name: 'Faculty Admin',
      password: hashedPassword,
      role: 'FACULTY',
    },
  })
  console.log('✅ Created faculty user:', { email: facultyUser.email, role: facultyUser.role })

  console.log('✨ Seeding completed!')
  console.log('\nYou can now sign in with:')
  console.log('Email: faculty@example.com')
  console.log('Password: password123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
