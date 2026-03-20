'use server'

import { prismaClient } from '@/lib/prisma'

export async function getClientsWithStats(barbershop_id: string) {
  const clients = await prismaClient.client.findMany({
    where: { barbershop_id },
    include: {
      bookings: {
        where: { status: 'FINALIZADO' },
        include: {
          service: { select: { id: true, name: true } },
          barber: { select: { id: true, name: true } },
        },
        orderBy: { date_time: 'desc' },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  return clients.map((client) => {
    const bookings = client.bookings

    const totalSpent = bookings.reduce(
      (sum, b) => sum + (b.total_price ?? 0),
      0,
    )

    const lastBooking = bookings[0] ?? null

    // Most booked barber
    const barberCount: Record<string, { name: string; count: number }> = {}
    for (const b of bookings) {
      if (!barberCount[b.barber.id]) {
        barberCount[b.barber.id] = { name: b.barber.name, count: 0 }
      }
      barberCount[b.barber.id].count++
    }
    const favoriteBarber =
      Object.values(barberCount).sort((a, b) => b.count - a.count)[0] ?? null

    // Most booked service
    const serviceCount: Record<string, { name: string; count: number }> = {}
    for (const b of bookings) {
      if (!serviceCount[b.service.id]) {
        serviceCount[b.service.id] = { name: b.service.name, count: 0 }
      }
      serviceCount[b.service.id].count++
    }
    const favoriteService =
      Object.values(serviceCount).sort((a, b) => b.count - a.count)[0] ?? null

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      fidelity_points: client.fidelity_points,
      last_visit: client.last_visit,
      created_at: client.created_at,
      totalBookings: bookings.length,
      totalSpent,
      lastService: lastBooking
        ? {
            name: lastBooking.service.name,
            barberName: lastBooking.barber.name,
            date: lastBooking.date_time,
          }
        : null,
      favoriteBarber: favoriteBarber?.name ?? null,
      favoriteService: favoriteService?.name ?? null,
    }
  })
}

export type ClientWithStats = Awaited<
  ReturnType<typeof getClientsWithStats>
>[number]
