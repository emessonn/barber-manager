'use server'

import { prismaClient } from '@/lib/prisma'
import { formatCurrency, formatDateBR } from '@/lib/utils'
import {
  sendWhatsAppMessage,
  msgConfirmacaoAgendamento,
  msgPagamentoConfirmado,
} from '@/lib/whatsapp'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateOnly(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Envia WhatsApp de confirmação para o primeiro booking de uma sessão de agendamento.
 * Chame após criar todos os bookings com sucesso.
 */
export async function sendBookingConfirmationWhatsApp(
  booking_id: string,
  appUrl: string,
): Promise<void> {
  try {
    const booking = await prismaClient.booking.findUnique({
      where: { id: booking_id },
      include: {
        client: true,
        barber: true,
        service: true,
        barbershop: { select: { name: true, slug: true } },
      },
    })

    if (!booking) return

    const message = msgConfirmacaoAgendamento({
      clientName: booking.client.name,
      serviceName: booking.service.name,
      barberName: booking.barber.name,
      date: formatDateOnly(booking.date_time),
      time: formatTime(booking.date_time),
      price: formatCurrency(booking.total_price ?? booking.service.price),
      barbershopName: booking.barbershop.name,
      cancelUrl: `${appUrl}/${booking.barbershop.slug}/minha-conta`,
    })

    await sendWhatsAppMessage(booking.client.phone, message)
  } catch (err) {
    // Não falha o fluxo se WhatsApp falhar
    console.error('[Notifications] Erro ao enviar confirmação WhatsApp:', err)
  }
}

/**
 * Envia WhatsApp de confirmação de pagamento.
 */
export async function sendPaymentConfirmedWhatsApp(
  booking_id: string,
): Promise<void> {
  try {
    const booking = await prismaClient.booking.findUnique({
      where: { id: booking_id },
      include: {
        client: true,
        service: true,
        barbershop: { select: { name: true } },
      },
    })

    if (!booking) return

    const message = msgPagamentoConfirmado({
      clientName: booking.client.name,
      serviceName: booking.service.name,
      price: formatCurrency(booking.total_price ?? booking.service.price),
      barbershopName: booking.barbershop.name,
    })

    await sendWhatsAppMessage(booking.client.phone, message)
  } catch (err) {
    console.error('[Notifications] Erro ao enviar confirmação de pagamento:', err)
  }
}
