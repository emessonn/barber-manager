import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? ''

async function getBarbershopSlug(userId: string): Promise<string | null> {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    include: { barbershop: { select: { slug: true } } },
  })
  return user?.barbershop?.slug ?? null
}

export async function GET() {
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

  const instanceName = await getBarbershopSlug(session.user.id)
  if (!instanceName) {
    return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
  }

  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      { headers: { apikey: EVOLUTION_API_KEY } },
    )

    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json(
        { error: `Erro ao buscar QR code: ${body}` },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json({ qrcode: data.base64 ?? null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

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

  const instanceName = await getBarbershopSlug(session.user.id)
  if (!instanceName) {
    return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
  }

  try {
    // Try to create the instance (ignore error if it already exists)
    await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    })

    // Fetch QR code
    const qrRes = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      { headers: { apikey: EVOLUTION_API_KEY } },
    )

    if (!qrRes.ok) {
      const body = await qrRes.text()
      return NextResponse.json(
        { error: `Erro ao gerar QR code: ${body}` },
        { status: qrRes.status },
      )
    }

    const data = await qrRes.json()
    return NextResponse.json({ qrcode: data.base64 ?? null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
