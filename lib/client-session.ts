import { cookies } from 'next/headers'
import { prismaClient } from '@/lib/prisma'

export const CLIENT_SESSION_COOKIE = 'client_session_token'

export async function getClientSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value

  if (!token) return null

  const session = await prismaClient.clientSession.findUnique({
    where: { session_token: token },
    include: { client: true },
  })

  if (!session || session.expires_at < new Date()) {
    return null
  }

  return session
}
