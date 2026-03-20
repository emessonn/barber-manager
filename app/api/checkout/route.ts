import { NextRequest, NextResponse } from 'next/server'
import { prismaClient } from '@/lib/prisma'
import { createPreference } from '@/lib/mercadopago'

/**
 * POST /api/checkout
 *
 * Cria uma preferência no MercadoPago e retorna a URL de checkout.
 *
 * Body:
 *   booking_ids: string[]   — IDs dos bookings a pagar
 *   client_name: string
 *   client_email?: string
 *   barbershop_slug: string — usado para montar as URLs de retorno
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { booking_ids, client_name, client_email, barbershop_slug } = body as {
      booking_ids: string[]
      client_name: string
      client_email?: string
      barbershop_slug: string
    }

    if (!booking_ids?.length || !barbershop_slug) {
      return NextResponse.json(
        { error: 'booking_ids e barbershop_slug são obrigatórios' },
        { status: 400 },
      )
    }

    // Busca os bookings com informações de serviço
    const bookings = await prismaClient.booking.findMany({
      where: { id: { in: booking_ids } },
      include: { service: true },
    })

    if (!bookings.length) {
      return NextResponse.json({ error: 'Bookings não encontrados' }, { status: 404 })
    }

    // Verifica se já não foram pagos
    const alreadyPaid = bookings.filter(
      (b) => b.payment_status === 'PAGO' || b.payment_status === 'PRESENCIAL',
    )
    if (alreadyPaid.length > 0) {
      return NextResponse.json({ error: 'Um ou mais serviços já foram pagos' }, { status: 409 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
    const baseUrl = `${appUrl}/${barbershop_slug}`

    // Monta os items para o MercadoPago
    const items = bookings.map((b) => ({
      id: b.id,
      title: b.service.name,
      quantity: 1,
      unit_price: b.total_price ?? b.service.price,
      currency_id: 'BRL',
    }))

    const externalRef = booking_ids.join(',')

    const preference = await createPreference({
      items,
      payer: {
        name: client_name,
        email: client_email,
      },
      external_reference: externalRef,
      back_urls: {
        success: `${baseUrl}/minha-conta?payment=success`,
        failure: `${baseUrl}/minha-conta?payment=failure`,
        pending: `${baseUrl}/minha-conta?payment=pending`,
      },
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
    })

    // Salva o preference_id em todos os bookings
    await prismaClient.booking.updateMany({
      where: { id: { in: booking_ids } },
      data: { payment_id: preference.id },
    })

    // Em produção usa init_point; em sandbox/dev usa sandbox_init_point
    const checkoutUrl =
      process.env.NODE_ENV === 'production'
        ? preference.init_point
        : preference.sandbox_init_point

    return NextResponse.json({ checkout_url: checkoutUrl, preference_id: preference.id })
  } catch (err) {
    console.error('[Checkout] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao criar checkout. Tente novamente.' },
      { status: 500 },
    )
  }
}
