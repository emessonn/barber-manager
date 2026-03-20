'use server'

import { cookies } from 'next/headers'
import { prismaClient } from '@/lib/prisma'
import { CLIENT_SESSION_COOKIE } from '@/lib/client-session'
import { sendWhatsAppMessage, msgOtpLogin } from '@/lib/whatsapp'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function requestOtp(phone: string, barbershop_id: string) {
  try {
    const [client, barbershop] = await Promise.all([
      prismaClient.client.findUnique({
        where: { phone_barbershop_id: { phone, barbershop_id } },
      }),
      prismaClient.barbershop.findUnique({
        where: { id: barbershop_id },
        select: { name: true },
      }),
    ])

    if (!client) {
      return {
        success: false,
        error: 'Nenhum cadastro encontrado para este telefone nesta barbearia.',
      }
    }

    // Limpar OTPs antigos
    await prismaClient.clientOtp.deleteMany({
      where: { phone, barbershop_id },
    })

    const otp = generateOtp()
    const expires_at = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos

    await prismaClient.clientOtp.create({
      data: { phone, barbershop_id, otp, expires_at },
    })

    await sendWhatsAppMessage(phone, msgOtpLogin({ otp, barbershopName: barbershop?.name ?? '' }))

    return { success: true, otp: process.env.NODE_ENV === 'development' ? otp : undefined }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Erro ao enviar código. Tente novamente.' }
  }
}

export async function verifyOtp(phone: string, barbershop_id: string, otp: string) {
  try {
    const record = await prismaClient.clientOtp.findFirst({
      where: { phone, barbershop_id, otp },
    })

    if (!record) {
      return { success: false, error: 'Código inválido.' }
    }

    if (record.expires_at < new Date()) {
      return { success: false, error: 'Código expirado. Solicite um novo.' }
    }

    // Deletar OTP usado
    await prismaClient.clientOtp.delete({ where: { id: record.id } })

    const client = await prismaClient.client.findUnique({
      where: { phone_barbershop_id: { phone, barbershop_id } },
    })

    if (!client) {
      return { success: false, error: 'Cliente não encontrado.' }
    }

    // Criar sessão (30 dias)
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const session = await prismaClient.clientSession.create({
      data: { client_id: client.id, barbershop_id, expires_at },
    })

    const cookieStore = await cookies()
    cookieStore.set(CLIENT_SESSION_COOKIE, session.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expires_at,
      path: '/',
    })

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Erro ao verificar código.' }
  }
}

export async function signOutClient() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value

    if (token) {
      await prismaClient.clientSession.deleteMany({ where: { session_token: token } })
      cookieStore.delete(CLIENT_SESSION_COOKIE)
    }

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false }
  }
}

export async function getMyBookings(session_token: string) {
  try {
    const session = await prismaClient.clientSession.findUnique({
      where: { session_token },
      include: { client: true },
    })

    if (!session || session.expires_at < new Date()) {
      return { success: false, error: 'Sessão expirada.' }
    }

    const bookings = await prismaClient.booking.findMany({
      where: { client_id: session.client_id },
      include: {
        barber: { select: { name: true, avatar_url: true } },
        service: { select: { name: true, price: true, duration_minutes: true } },
        barbershop: { select: { name: true, slug: true, phone: true } },
      },
      orderBy: { date_time: 'desc' },
    })

    return { success: true, bookings, client: session.client }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Erro ao buscar agendamentos.' }
  }
}

export async function cancelMyBooking(booking_id: string, session_token: string) {
  try {
    const session = await prismaClient.clientSession.findUnique({
      where: { session_token },
    })

    if (!session || session.expires_at < new Date()) {
      return { success: false, error: 'Sessão expirada.' }
    }

    const booking = await prismaClient.booking.findUnique({
      where: { id: booking_id },
    })

    if (!booking || booking.client_id !== session.client_id) {
      return { success: false, error: 'Agendamento não encontrado.' }
    }

    if (booking.status === 'CANCELADO' || booking.status === 'FINALIZADO') {
      return { success: false, error: 'Este agendamento não pode ser cancelado.' }
    }

    if (booking.date_time < new Date()) {
      return { success: false, error: 'Não é possível cancelar agendamentos passados.' }
    }

    if (booking.payment_status === 'PENDENTE') {
      // Pagamento nunca ocorreu — remove registros financeiros e comissão
      await Promise.all([
        prismaClient.financialRecord.deleteMany({ where: { booking_id } }),
        prismaClient.commission.deleteMany({ where: { booking_id } }),
      ])

      await prismaClient.booking.update({
        where: { id: booking_id },
        data: { status: 'CANCELADO' },
      })
    } else if (booking.payment_status === 'PAGO') {
      // TODO: Reembolso — chamar refundPayment(booking.payment_external_id!) do MercadoPago,
      // criar um FinancialRecord tipo SAIDA com o valor, e deletar a Commission.
      // Por ora, marca como REEMBOLSADO para sinalizar ao admin que precisa de ação manual.
      await prismaClient.booking.update({
        where: { id: booking_id },
        data: { status: 'CANCELADO', payment_status: 'REEMBOLSADO' },
      })
    } else {
      // PRESENCIAL ou outro — só cancela
      await prismaClient.booking.update({
        where: { id: booking_id },
        data: { status: 'CANCELADO' },
      })
    }

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Erro ao cancelar agendamento.' }
  }
}
