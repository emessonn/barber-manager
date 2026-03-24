import { NextRequest, NextResponse } from 'next/server'
import { prismaClient } from '@/lib/prisma'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function laterTime(a: string, b: string): string {
  return timeToMinutes(a) >= timeToMinutes(b) ? a : b
}

function earlierTime(a: string, b: string): string {
  return timeToMinutes(a) <= timeToMinutes(b) ? a : b
}

const DAY_MAP: Record<string, string> = {
  sunday: 'sunday',
  monday: 'monday',
  tuesday: 'tuesday',
  wednesday: 'wednesday',
  thursday: 'thursday',
  friday: 'friday',
  saturday: 'saturday',
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const barber_id = searchParams.get('barber_id')
  const date = searchParams.get('date')
  const service_duration = searchParams.get('service_duration')

  if (!barber_id || !date || !service_duration) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  try {
    const barber = await prismaClient.barber.findUnique({
      where: { id: barber_id },
      include: { barbershop: true },
    })

    if (!barber) {
      return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 })
    }

    // Parse date preserving the local date (avoid UTC shift)
    const [year, month, day] = date.split('-').map(Number)
    const requestDate = new Date(year, month - 1, day)

    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
      .format(requestDate)
      .toLowerCase() as keyof typeof DAY_MAP

    const shopHoursRaw = barber.barbershop.working_hours as Record<string, any> | null
    const shopDay = shopHoursRaw?.[dayOfWeek]
    const barberHoursRaw = barber.working_hours as Record<string, any> | null
    const barberDay = barberHoursRaw?.[dayOfWeek]

    // Check if the barbershop has a closed-day exception for this date
    const exception = await prismaClient.barbershopException.findFirst({
      where: {
        barbershop_id: barber.barbershop_id,
        date: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        },
      },
    })
    if (exception) {
      return NextResponse.json({
        success: true,
        available_times: [],
        exception: { reason: exception.reason },
      })
    }

    // Only enforce shop closure when this specific day is explicitly configured
    if (shopDay && (shopDay.open === false || !shopDay.start || !shopDay.end)) {
      return NextResponse.json({ success: true, available_times: [] })
    }

    // If barber explicitly has no hours for this day, they're off
    if (barberDay && !barberDay.start && !barberDay.end) {
      return NextResponse.json({ success: true, available_times: [] })
    }

    // Resolve effective working window — default to 08:00–18:00 when not configured
    const DEFAULT_START = '08:00'
    const DEFAULT_END = '18:00'

    const shopStart = shopDay?.start ?? null
    const shopEnd = shopDay?.end ?? null
    const barberStart = barberDay?.start ?? null
    const barberEnd = barberDay?.end ?? null

    const effectiveStart =
      shopStart && barberStart ? laterTime(shopStart, barberStart)
      : barberStart ?? shopStart ?? DEFAULT_START

    const effectiveEnd =
      shopEnd && barberEnd ? earlierTime(shopEnd, barberEnd)
      : barberEnd ?? shopEnd ?? DEFAULT_END

    if (!effectiveStart || !effectiveEnd || timeToMinutes(effectiveStart) >= timeToMinutes(effectiveEnd)) {
      return NextResponse.json({ success: true, available_times: [] })
    }

    // Fetch active bookings for the day
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0)
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999)

    const bookings = await prismaClient.booking.findMany({
      where: {
        barber_id,
        date_time: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDENTE', 'CONFIRMADO'] },
      },
      include: { service: true },
    })

    // Generate available slots (30-min increments, service duration must fit)
    const availableTimes: string[] = []
    const duration = parseInt(service_duration)

    const [startHour, startMin] = effectiveStart.split(':').map(Number)
    const [endHour, endMin] = effectiveEnd.split(':').map(Number)

    let currentTime = new Date(year, month - 1, day, startHour, startMin, 0, 0)
    const endTime = new Date(year, month - 1, day, endHour, endMin, 0, 0)

    const now = new Date()
    const isToday = requestDate.toDateString() === now.toDateString()

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60_000)

      // Skip slots already in the past
      if (isToday && currentTime <= now) {
        currentTime = new Date(currentTime.getTime() + 30 * 60_000)
        continue
      }

      // Check for conflicts with existing bookings
      const hasConflict = bookings.some((booking) => {
        const bookingDuration = booking.service.duration_minutes * 60_000
        const bookingEnd = new Date(booking.date_time.getTime() + bookingDuration)
        return currentTime < bookingEnd && slotEnd > booking.date_time
      })

      if (!hasConflict && slotEnd <= endTime) {
        const h = String(currentTime.getHours()).padStart(2, '0')
        const m = String(currentTime.getMinutes()).padStart(2, '0')
        availableTimes.push(`${h}:${m}`)
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60_000)
    }

    return NextResponse.json({ success: true, available_times: availableTimes })
  } catch (error) {
    console.error('Erro ao buscar horários:', error)
    return NextResponse.json({ error: 'Erro ao buscar horários' }, { status: 500 })
  }
}
