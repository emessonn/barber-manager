import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { BookingsClient } from './_components/BookingsClient'

export default async function BookingsPage() {
  const session = await auth()

  if (!session?.user?.id) return <div>Não autorizado</div>

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.barbershop_id) return <div>Barbearia não encontrada</div>

  const bookings = await prismaClient.booking.findMany({
    where: { barbershop_id: user.barbershop_id },
    select: {
      id: true,
      date_time: true,
      status: true,
      payment_status: true,
      total_price: true,
      notes: true,
      client: { select: { name: true, phone: true } },
      barber: { select: { name: true } },
      service: { select: { name: true, price: true } },
    },
    orderBy: { date_time: 'desc' },
  })

  return <BookingsClient bookings={bookings} />
}
