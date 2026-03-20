import { PrismaClient } from '@prisma/client'

// Singleton pattern para Prisma Client para evitar múltiplas instâncias em desenvolvimento
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            /* 'query', 'error', 'warn' */
          ]
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient

export default prismaClient
