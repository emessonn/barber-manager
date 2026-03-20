'use client'

import { useRouter } from 'next/navigation'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, User, Clock, CalendarDays, CalendarX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Barber {
  id: string
  name: string
  avatar_url: string | null
  working_hours: Record<string, { start: string; end: string; break_time?: number }>
}

interface Booking {
  id: string
  barber_id: string
  date_time: string
  status: string
  total_price: number | null
  client: { name: string; phone: string }
  service: { name: string; duration_minutes: number; price: number }
}

interface Props {
  dateStr: string
  barbershopWorkingHours: Record<string, { open: boolean; start: string; end: string }>
  barbers: Barber[]
  bookings: Booking[]
  closedException: { reason: string | null } | null
}

type ScheduleBlock =
  | { type: 'booking'; startMin: number; endMin: number; booking: Booking }
  | { type: 'free'; startMin: number; endMin: number }
  | { type: 'closed' }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minToTime(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function laterMin(a: number, b: number) { return Math.max(a, b) }
function earlierMin(a: number, b: number) { return Math.min(a, b) }

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  CONFIRMADO: 'border-blue-500/50 bg-blue-500/10 text-blue-300',
  FINALIZADO: 'border-green-500/50 bg-green-500/10 text-green-300',
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  FINALIZADO: 'Finalizado',
}

// ─── Schedule builder ─────────────────────────────────────────────────────────

const DEFAULT_OPEN = '08:00'
const DEFAULT_CLOSE = '18:00'

function buildSchedule(
  barber: Barber,
  barbershopHours: Props['barbershopWorkingHours'],
  bookings: Booking[],
  dayKey: string,
): { blocks: ScheduleBlock[]; openMin: number; closeMin: number } {
  const shopDay = barbershopHours[dayKey]

  // Only treat as closed when the day is explicitly configured as closed
  if (shopDay && (shopDay.open === false || !shopDay.start || !shopDay.end)) {
    return { blocks: [{ type: 'closed' }], openMin: 0, closeMin: 0 }
  }

  const barberDay = barber.working_hours?.[dayKey]

  // If barber explicitly has no hours for this day, they're off
  if (barberDay && !barberDay.start && !barberDay.end) {
    return { blocks: [{ type: 'closed' }], openMin: 0, closeMin: 0 }
  }

  const shopStart = shopDay?.start ?? null
  const shopEnd = shopDay?.end ?? null
  const barberStart = barberDay?.start ?? null
  const barberEnd = barberDay?.end ?? null

  const openMin =
    shopStart && barberStart ? laterMin(toMin(shopStart), toMin(barberStart))
    : barberStart ? toMin(barberStart)
    : shopStart ? toMin(shopStart)
    : toMin(DEFAULT_OPEN)

  const closeMin =
    shopEnd && barberEnd ? earlierMin(toMin(shopEnd), toMin(barberEnd))
    : barberEnd ? toMin(barberEnd)
    : shopEnd ? toMin(shopEnd)
    : toMin(DEFAULT_CLOSE)

  if (openMin >= closeMin) {
    return { blocks: [{ type: 'closed' }], openMin: 0, closeMin: 0 }
  }

  const dayBookings = bookings
    .filter((b) => b.barber_id === barber.id)
    .map((b) => ({
      booking: b,
      startMin: toMin(format(parseISO(b.date_time), 'HH:mm')),
      endMin: toMin(format(parseISO(b.date_time), 'HH:mm')) + b.service.duration_minutes,
    }))
    .sort((a, b) => a.startMin - b.startMin)

  const blocks: ScheduleBlock[] = []
  let cursor = openMin

  for (const { booking, startMin, endMin } of dayBookings) {
    if (cursor < startMin) {
      blocks.push({ type: 'free', startMin: cursor, endMin: startMin })
    }
    blocks.push({ type: 'booking', startMin, endMin, booking })
    cursor = Math.max(cursor, endMin)
  }

  if (cursor < closeMin) {
    blocks.push({ type: 'free', startMin: cursor, endMin: closeMin })
  }

  return { blocks, openMin, closeMin }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AgendaClient({ dateStr, barbershopWorkingHours, barbers, bookings, closedException }: Props) {
  const router = useRouter()

  // Parse date without UTC shift
  const [y, mo, d] = dateStr.split('-').map(Number)
  const currentDate = new Date(y, mo - 1, d)

  const dayKey = DAY_NAMES[currentDate.getDay()]

  const isToday =
    currentDate.toDateString() === new Date().toDateString()

  function navigate(delta: number) {
    const next = delta > 0 ? addDays(currentDate, delta) : subDays(currentDate, Math.abs(delta))
    router.push(`/admin/agenda?date=${format(next, 'yyyy-MM-dd')}`)
  }

  function goToday() {
    router.push('/admin/agenda')
  }

  return (
    <div className='space-y-8 p-8 md:p-12'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>Agenda do Dia</h1>
        <p className='text-zinc-400'>Visualize o dia completo por barbeiro</p>
      </div>

      {/* Date navigator */}
      <div className='flex items-center gap-3'>
        <Button variant='outline' size='sm' onClick={() => navigate(-1)}>
          <ChevronLeft className='h-4 w-4' />
        </Button>

        <div className='flex items-center gap-2 min-w-48 justify-center'>
          <CalendarDays className='h-4 w-4 text-amber-500' />
          <span className='font-semibold capitalize'>
            {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>

        <Button variant='outline' size='sm' onClick={() => navigate(1)}>
          <ChevronRight className='h-4 w-4' />
        </Button>

        {!isToday && (
          <Button variant='ghost' size='sm' onClick={goToday} className='text-amber-500'>
            Hoje
          </Button>
        )}
      </div>

      {/* Closed exception banner */}
      {closedException && (
        <div className='flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400'>
          <CalendarX className='h-5 w-5 shrink-0' />
          <div>
            <p className='font-medium'>Barbearia fechada neste dia</p>
            {closedException.reason && (
              <p className='text-sm text-red-400/70'>{closedException.reason}</p>
            )}
          </div>
        </div>
      )}

      {/* Per-barber cards */}
      {closedException ? null : barbers.length === 0 ? (
        <p className='text-zinc-400 text-sm'>Nenhum barbeiro ativo cadastrado.</p>
      ) : (
        <div className='space-y-6'>
          {barbers.map((barber) => {
            const { blocks, openMin, closeMin } = buildSchedule(
              barber,
              barbershopWorkingHours,
              bookings,
              dayKey,
            )

            const isClosed = blocks.length === 1 && blocks[0].type === 'closed'
            const barberBookings = bookings.filter((b) => b.barber_id === barber.id)
            const bookedMin = barberBookings.reduce((acc, b) => acc + b.service.duration_minutes, 0)
            const totalMin = closeMin - openMin
            const freeMin = Math.max(0, totalMin - bookedMin)
            const breakMin = barber.working_hours?.[dayKey]?.break_time ?? 0

            return (
              <Card key={barber.id} className='border-zinc-700 bg-zinc-900/50'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between flex-wrap gap-2'>
                    {/* Barber info */}
                    <div className='flex items-center gap-3'>
                      {barber.avatar_url ? (
                        <img
                          src={barber.avatar_url}
                          alt={barber.name}
                          className='h-9 w-9 rounded-full object-cover'
                        />
                      ) : (
                        <div className='h-9 w-9 rounded-full bg-amber-600/20 flex items-center justify-center'>
                          <User className='h-4 w-4 text-amber-500' />
                        </div>
                      )}
                      <div>
                        <p className='font-semibold'>{barber.name}</p>
                        {!isClosed && (
                          <p className='text-xs text-zinc-500'>
                            {minToTime(openMin)} – {minToTime(closeMin)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Summary pills */}
                    {!isClosed && (
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20'>
                          {barberBookings.length} agendamento{barberBookings.length !== 1 ? 's' : ''}
                        </span>
                        <span className='text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {formatDuration(freeMin - breakMin > 0 ? freeMin - breakMin : freeMin)} livre{breakMin > 0 ? ` (${formatDuration(breakMin)} intervalo)` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className='pt-0'>
                  {isClosed ? (
                    <div className='rounded-lg border border-zinc-800 bg-zinc-800/30 px-4 py-3 text-sm text-zinc-500 text-center'>
                      Folga / barbearia fechada neste dia
                    </div>
                  ) : (
                    <div className='space-y-1.5'>
                      {blocks.map((block, i) => {
                        if (block.type === 'free') {
                          const dur = block.endMin - block.startMin
                          return (
                            <div
                              key={i}
                              className='flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/20 px-3 py-2'
                            >
                              <span className='text-xs text-zinc-600 font-mono w-11 shrink-0'>
                                {minToTime(block.startMin)}
                              </span>
                              <div className='h-3 w-0.5 bg-zinc-700 shrink-0' />
                              <span className='text-xs text-zinc-500'>
                                Livre · {formatDuration(dur)}
                              </span>
                            </div>
                          )
                        }

                        if (block.type === 'booking') {
                          const { booking } = block
                          const dur = booking.service.duration_minutes
                          return (
                            <div
                              key={i}
                              className={cn(
                                'flex items-start gap-3 rounded-lg border px-3 py-2.5',
                                STATUS_COLORS[booking.status] ?? 'border-zinc-700 bg-zinc-800/40',
                              )}
                            >
                              <span className='text-xs font-mono w-11 shrink-0 mt-0.5 opacity-80'>
                                {minToTime(block.startMin)}
                              </span>
                              <div className='h-full w-0.5 bg-current opacity-30 shrink-0 mt-1' />
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between gap-2 flex-wrap'>
                                  <span className='text-sm font-medium leading-tight'>
                                    {booking.service.name}
                                  </span>
                                  <span className='text-xs opacity-70'>
                                    {formatDuration(dur)}
                                  </span>
                                </div>
                                <p className='text-xs opacity-70 mt-0.5'>
                                  {booking.client.name}
                                </p>
                                <span className='text-[10px] opacity-60 mt-1 inline-block'>
                                  {STATUS_LABELS[booking.status]}
                                  {' · '}
                                  até {minToTime(block.endMin)}
                                </span>
                              </div>
                            </div>
                          )
                        }

                        return null
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
