import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth from 'next-auth'
import { prismaClient } from './prisma'
import { authConfig } from './auth.config'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role?: string
      hasBarbershop?: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
  interface User {
    role?: string
  }
}


const prismaAdapter = PrismaAdapter(prismaClient)

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
        // Check if user has a barbershop on first sign-in
        const dbUser = await prismaClient.user.findUnique({
          where: { id: user.id! },
          select: { barbershop_id: true },
        })
        token.hasBarbershop = !!dbUser?.barbershop_id
      }
      // Called when useSession().update() is triggered after onboarding
      if (trigger === 'update' && session) {
        if (session.role) token.role = session.role
        if (typeof session.hasBarbershop === 'boolean')
          token.hasBarbershop = session.hasBarbershop
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string | undefined
        session.user.hasBarbershop = token.hasBarbershop as boolean | undefined
      }
      return session
    },
  },
})
