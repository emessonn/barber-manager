import { NextRequest, NextResponse } from 'next/server'
import { prismaClient } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { sendWhatsAppMessage, msgLembrete24h, msgLembrete2h } from '@/lib/whatsapp'

/**
 * GET /api/cron/reminders
 *
 * Cron job que envia lembretes de agendamento via WhatsApp.
 * Roda a cada 30 minutos via Vercel Cron (vercel.json).
 *
 * Lembretes enviados:
 *   - 24h antes do horário: lembrete do dia seguinte
 *   - 2h antes do horário: lembrete imediato
 *
 * Protegido pela env var CRON_SECRET (cabeçalho Authorization: Bearer <secret>).
 */
export async function GET(req: NextRequest) {
  // Proteção do endpoint
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // ─── Janela de 24h: bookings entre 23h e 25h a partir de agora ───────────────
  const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  // ─── Janela de 2h: bookings entre 1h45 e 2h15 a partir de agora ─────────────
  const window2hStart = new Date(now.getTime() + 105 * 60 * 1000)
  const window2hEnd = new Date(now.getTime() + 135 * 60 * 1000)

  const [bookings24h, bookings2h] = await Promise.all([
    prismaClient.booking.findMany({
      where: {
        status: 'CONFIRMADO',
        reminder_24h_sent: false,
        date_time: { gte: window24hStart, lte: window24hEnd },
      },
      include: {
        client: true,
        barber: true,
        service: true,
        barbershop: { select: { name: true } },
      },
    }),
    prismaClient.booking.findMany({
      where: {
        status: 'CONFIRMADO',
        reminder_2h_sent: false,
        date_time: { gte: window2hStart, lte: window2hEnd },
      },
      include: {
        client: true,
        barber: true,
        service: true,
        barbershop: { select: { name: true } },
      },
    }),
  ])

  let sent24h = 0
  let sent2h = 0
  const errors: string[] = []

  // Envia lembretes de 24h
  for (const booking of bookings24h) {
    try {
      const message = msgLembrete24h({
        clientName: booking.client.name,
        serviceName: booking.service.name,
        barberName: booking.barber.name,
        date: booking.date_time.toLocaleDateString('pt-BR'),
        time: booking.date_time.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        barbershopName: booking.barbershop.name,
      })

      await sendWhatsAppMessage(booking.client.phone, message)
      await prismaClient.booking.update({
        where: { id: booking.id },
        data: { reminder_24h_sent: true },
      })
      sent24h++
    } catch (err) {
      errors.push(`24h booking ${booking.id}: ${String(err)}`)
    }
  }

  // Envia lembretes de 2h
  for (const booking of bookings2h) {
    try {
      const message = msgLembrete2h({
        clientName: booking.client.name,
        barberName: booking.barber.name,
        time: booking.date_time.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        barbershopName: booking.barbershop.name,
      })

      await sendWhatsAppMessage(booking.client.phone, message)
      await prismaClient.booking.update({
        where: { id: booking.id },
        data: { reminder_2h_sent: true },
      })
      sent2h++
    } catch (err) {
      errors.push(`2h booking ${booking.id}: ${String(err)}`)
    }
  }

  console.log(
    `[Cron/Reminders] Enviados: ${sent24h} lembretes 24h, ${sent2h} lembretes 2h. Erros: ${errors.length}`,
  )

  return NextResponse.json({
    ok: true,
    sent_24h: sent24h,
    sent_2h: sent2h,
    errors: errors.length > 0 ? errors : undefined,
  })
}
