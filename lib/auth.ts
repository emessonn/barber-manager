import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prismaClient } from './prisma'
import { authConfig } from './auth.config'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role?: string
      hasBarbershop?: boolean
      barbershopId?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
  interface User {
    role?: string
    barbershopId?: string
  }
}


const prismaAdapter = PrismaAdapter(prismaClient)

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        login: { label: 'Login', type: 'text' },
        password: { label: 'Senha', type: 'password' },
        barbershopSlug: { label: 'Barbearia', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password || !credentials?.barbershopSlug) {
          return null
        }

        const barbershop = await prismaClient.barbershop.findUnique({
          where: { slug: credentials.barbershopSlug as string },
          select: { id: true },
        })

        if (!barbershop) return null

        const user = await prismaClient.user.findFirst({
          where: {
            login: credentials.login as string,
            barbershop_id: barbershop.id,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            barbershop_id: true,
            password_hash: true,
          },
        })

        if (!user || !user.password_hash) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.password_hash)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          role: user.role,
          barbershopId: user.barbershop_id ?? undefined,
        }
      },
    }),
  ],
  adapter: prismaAdapter,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        // For credentials users, barbershopId comes directly from authorize()
        if (user.barbershopId) {
          token.hasBarbershop = true
          token.barbershopId = user.barbershopId
        } else {
          // For OAuth users, check from DB
          const dbUser = await prismaClient.user.findUnique({
            where: { id: user.id! },
            select: { barbershop_id: true },
          })
          token.hasBarbershop = !!dbUser?.barbershop_id
          token.barbershopId = dbUser?.barbershop_id ?? undefined
        }
      }
      // Called when useSession().update() is triggered after onboarding
      if (trigger === 'update' && session) {
        if (session.role) token.role = session.role
        if (typeof session.hasBarbershop === 'boolean')
          token.hasBarbershop = session.hasBarbershop
        if (session.barbershopId) token.barbershopId = session.barbershopId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string | undefined
        session.user.hasBarbershop = token.hasBarbershop as boolean | undefined
        session.user.barbershopId = token.barbershopId as string | undefined
      }
      return session
    },
  },
})
