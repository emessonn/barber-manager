import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { AgendaClient } from './_components/AgendaClient'

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return <div>Não autorizado</div>

  const user = await prismaClient.user.findUnique({ where: { id: session.user.id } })
  if (!user?.barbershop_id) return <div>Barbearia não encontrada</div>

  const { date: dateParam } = await searchParams

  // Parse date from query param or use today — avoid UTC shift
  let selectedDate: Date
  if (dateParam) {
    const [y, m, d] = dateParam.split('-').map(Number)
    selectedDate = new Date(y, m - 1, d, 0, 0, 0, 0)
  } else {
    const now = new Date()
    selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  }

  const dayEnd = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    23, 59, 59, 999,
  )

  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

  const [barbershop, barbers, bookings, exception] = await Promise.all([
    prismaClient.barbershop.findUnique({ where: { id: user.barbershop_id } }),
    prismaClient.barber.findMany({
      where: { barbershop_id: user.barbershop_id, is_active: true },
      orderBy: { name: 'asc' },
    }),
    prismaClient.booking.findMany({
      where: {
        barbershop_id: user.barbershop_id,
        date_time: { gte: selectedDate, lte: dayEnd },
        status: { notIn: ['CANCELADO'] },
      },
      include: {
        client: { select: { name: true, phone: true } },
        service: { select: { name: true, duration_minutes: true, price: true } },
      },
      orderBy: { date_time: 'asc' },
    }),
    prismaClient.barbershopException.findFirst({
      where: {
        barbershop_id: user.barbershop_id,
        date: {
          gte: new Date(`${dateStr}T00:00:00.000Z`),
          lte: new Date(`${dateStr}T23:59:59.999Z`),
        },
      },
    }),
  ])

  if (!barbershop) return <div>Barbearia não encontrada</div>

  // Serialize for client component
  const serializedBookings = bookings.map((b) => ({
    id: b.id,
    barber_id: b.barber_id,
    date_time: b.date_time.toISOString(),
    status: b.status,
    total_price: b.total_price,
    client: b.client,
    service: b.service,
  }))

  const serializedBarbers = barbers.map((b) => ({
    id: b.id,
    name: b.name,
    avatar_url: b.avatar_url,
    working_hours: b.working_hours as Record<string, { start: string; end: string; break_time?: number }>,
  }))

  return (
    <AgendaClient
      dateStr={dateStr}
      barbershopWorkingHours={
        (barbershop.working_hours as Record<string, { open: boolean; start: string; end: string }> | null) ?? {}
      }
      barbers={serializedBarbers}
      bookings={serializedBookings}
      closedException={exception ? { reason: exception.reason } : null}
    />
  )
}
