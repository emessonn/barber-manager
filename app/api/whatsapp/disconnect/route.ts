import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? ''

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return NextResponse.json(
      { error: 'Evolution API não configurada' },
      { status: 503 },
    )
  }

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
    include: { barbershop: { select: { slug: true } } },
  })

  const instanceName = user?.barbershop?.slug
  if (!instanceName) {
    return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
  }

  try {
    // Logout from WhatsApp
    await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: EVOLUTION_API_KEY },
    })

    // Delete the instance
    await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: EVOLUTION_API_KEY },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
