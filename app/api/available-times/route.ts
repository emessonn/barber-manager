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
  // tz_offset: valor de new Date().getTimezoneOffset() no browser
  // Positivo = atrás do UTC (ex: UTC-3 = 180)
  const tz_offset = parseInt(searchParams.get('tz_offset') ?? '0')
  const tzOffsetMs = tz_offset * 60_000

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

    const [year, month, day] = date.split('-').map(Number)

    // Dia da semana baseado na data local
    const requestDate = new Date(year, month - 1, day)
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
      .format(requestDate)
      .toLowerCase() as keyof typeof DAY_MAP

    const shopHoursRaw = barber.barbershop.working_hours as Record<string, any> | null
    const shopDay = shopHoursRaw?.[dayOfWeek]
    const barberHoursRaw = barber.working_hours as Record<string, any> | null
    const barberDay = barberHoursRaw?.[dayOfWeek]

    // Checar exceção de dia fechado
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

    if (shopDay && (shopDay.open === false || !shopDay.start || !shopDay.end)) {
      return NextResponse.json({ success: true, available_times: [] })
    }

    if (barberDay && !barberDay.start && !barberDay.end) {
      return NextResponse.json({ success: true, available_times: [] })
    }

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

    // Converte "HH:MM local" para UTC usando o offset do cliente.
    // Exemplo: "09:00" com UTC-3 (offset=180) → UTC 12:00
    // UTC = local_naive + tzOffsetMs
    const [startHour, startMin] = effectiveStart.split(':').map(Number)
    const [endHour, endMin] = effectiveEnd.split(':').map(Number)

    const startUtcMs = Date.UTC(year, month - 1, day, startHour, startMin) + tzOffsetMs
    const endUtcMs   = Date.UTC(year, month - 1, day, endHour,   endMin)   + tzOffsetMs

    // Buscar agendamentos no intervalo UTC do dia local
    const dayStartUtcMs = Date.UTC(year, month - 1, day, 0,  0,  0,   0) + tzOffsetMs
    const dayEndUtcMs   = Date.UTC(year, month - 1, day, 23, 59, 59, 999) + tzOffsetMs

    const bookings = await prismaClient.booking.findMany({
      where: {
        barber_id,
        date_time: { gte: new Date(dayStartUtcMs), lte: new Date(dayEndUtcMs) },
        status: { in: ['PENDENTE', 'CONFIRMADO'] },
      },
      include: { service: true },
    })

    // Verificar se é hoje no horário local do cliente
    const nowLocalMs = Date.now() - tzOffsetMs
    const nowLocal = new Date(nowLocalMs)
    const isToday =
      nowLocal.getUTCFullYear() === year &&
      nowLocal.getUTCMonth()    === month - 1 &&
      nowLocal.getUTCDate()     === day

    const duration = parseInt(service_duration)
    const slotStep = 30 * 60_000
    const availableTimes: string[] = []

    let slotStartMs = startUtcMs

    while (slotStartMs < endUtcMs) {
      const slotEndMs = slotStartMs + duration * 60_000

      // Pular slots já passados
      if (isToday && slotStartMs <= Date.now()) {
        slotStartMs += slotStep
        continue
      }

      // Verificar conflito com agendamentos existentes
      const hasConflict = bookings.some((booking) => {
        const bookingStartMs = booking.date_time.getTime()
        const bookingEndMs   = bookingStartMs + booking.service.duration_minutes * 60_000
        return slotStartMs < bookingEndMs && slotEndMs > bookingStartMs
      })

      if (!hasConflict && slotEndMs <= endUtcMs) {
        // Converter de volta para HH:MM no horário local do cliente
        const localSlotMs = slotStartMs - tzOffsetMs
        const d = new Date(localSlotMs)
        const h = String(d.getUTCHours()).padStart(2, '0')
        const m = String(d.getUTCMinutes()).padStart(2, '0')
        availableTimes.push(`${h}:${m}`)
      }

      slotStartMs += slotStep
    }

    return NextResponse.json({ success: true, available_times: availableTimes })
  } catch (error) {
    console.error('Erro ao buscar horários:', error)
    return NextResponse.json({ error: 'Erro ao buscar horários' }, { status: 500 })
  }
}
