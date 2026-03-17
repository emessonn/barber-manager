import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prismaClient } from "./prisma";

const prismaAdapter = PrismaAdapter(prismaClient);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prismaAdapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Aqui poderíamos adicionar lógica para identificar a barbearia
      // Por exemplo, baseado no domínio do email ou de um parâmetro na URL
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  trustHost: true,
});
