import { NextRequest, NextResponse } from 'next/server'
import { prismaClient } from '@/lib/prisma'
import { getPayment, validateWebhookSignature } from '@/lib/mercadopago'
import { sendPaymentConfirmedWhatsApp } from '@/actions/notifications'

/**
 * POST /api/webhooks/mercadopago
 *
 * Recebe notificações de pagamento do MercadoPago e atualiza o status dos bookings.
 *
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * Em desenvolvimento, use ngrok para expor o localhost:
 *   ngrok http 3000
 *   → setar NEXT_PUBLIC_APP_URL=https://xxxx.ngrok.io no .env.local
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type: string
      data?: { id: string }
      action?: string
    }

    // MercadoPago envia diferentes tipos: payment, merchant_order, etc.
    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ received: true })
    }

    // Valida assinatura (opcional mas recomendado em produção)
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (webhookSecret) {
      const xSignature = req.headers.get('x-signature')
      const xRequestId = req.headers.get('x-request-id')

      const isValid = validateWebhookSignature(
        xSignature,
        xRequestId,
        body.data.id,
        webhookSecret,
      )

      if (!isValid) {
        console.warn('[Webhook/MP] Assinatura inválida')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Busca detalhes do pagamento na API do MercadoPago
    const payment = await getPayment(body.data.id)

    // external_reference contém os booking IDs separados por vírgula
    const bookingIds = payment.external_reference?.split(',').filter(Boolean) ?? []
    if (!bookingIds.length) {
      console.warn('[Webhook/MP] external_reference vazio para payment', payment.id)
      return NextResponse.json({ received: true })
    }

    // Idempotência: verifica se algum booking já foi processado
    const existingPaid = await prismaClient.booking.findFirst({
      where: {
        id: { in: bookingIds },
        payment_external_id: String(payment.id),
      },
    })
    if (existingPaid) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    if (payment.status === 'approved') {
      // Busca dados dos bookings para criar FinancialRecords
      const bookings = await prismaClient.booking.findMany({
        where: { id: { in: bookingIds } },
        include: { service: true, client: true },
      })

      await prismaClient.$transaction([
        prismaClient.booking.updateMany({
          where: { id: { in: bookingIds } },
          data: {
            payment_status: 'PAGO',
            payment_external_id: String(payment.id),
          },
        }),
        ...bookings.map((b) =>
          prismaClient.financialRecord.upsert({
            where: { booking_id: b.id },
            create: {
              barbershop_id: b.barbershop_id,
              type: 'ENTRADA',
              amount: b.total_price ?? b.service.price,
              description: `Serviço: ${b.service.name} - Cliente: ${b.client.name}`,
              category: 'SERVIÇO',
              booking_id: b.id,
            },
            update: {
              amount: b.total_price ?? b.service.price,
            },
          }),
        ),
      ])

      // Envia confirmação de pagamento via WhatsApp (só para o primeiro booking)
      await sendPaymentConfirmedWhatsApp(bookingIds[0])
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await prismaClient.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { payment_status: 'PENDENTE' },
      })
    } else if (payment.status === 'refunded') {
      await prismaClient.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { payment_status: 'REEMBOLSADO' },
      })
    }

    return NextResponse.json({ received: true, status: payment.status })
  } catch (err) {
    console.error('[Webhook/MP] Erro:', err)
    // Retorna 200 mesmo em erro para evitar reenvios infinitos do MercadoPago
    return NextResponse.json({ received: true, error: true })
  }
}
