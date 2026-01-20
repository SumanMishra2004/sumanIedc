import prisma from '@/lib/prisma'

export type UserRole = 'STUDENT' | 'TEACHER' | 'FACULTY'

export async function addSpecialUser(email: string, role: UserRole) {
  return await prisma.specialUser.upsert({
    where: { email },
    create: { email, role },
    update: { role },
  })
}

export async function removeSpecialUser(email: string) {
  return await prisma.specialUser.delete({
    where: { email },
  })
}

export async function getSpecialUser(email: string) {
  return await prisma.specialUser.findUnique({
    where: { email },
  })
}

export async function getAllSpecialUsers() {
  return await prisma.specialUser.findMany()
}

export async function getUserRole(email: string): Promise<UserRole> {
  const specialUser = await getSpecialUser(email)
  return (specialUser?.role as UserRole) || 'STUDENT'
}
