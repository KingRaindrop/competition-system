import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const hash = bcrypt.hashSync('admin', 10)

const user = await prisma.user.update({
  where: { userId: 'admin01' },
  data: { userId: 'admin', password: hash },
})
console.log('Admin updated:', user.userId)
await prisma.$disconnect()
