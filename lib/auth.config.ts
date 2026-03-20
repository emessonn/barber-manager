import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

// Edge-compatible config — no Prisma, no Node.js-only dependencies
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return true // actual route protection is handled in middleware.ts
    },
  },
  trustHost: true,
}
