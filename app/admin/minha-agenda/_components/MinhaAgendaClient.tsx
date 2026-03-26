'use client'

import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Phone, Clock, Scissors, MessageCircle } from 'lucide-react'

type Booking = {
  id: string
  date_time: Date
  status: string
  payment_status: string
  total_price: number | null
  notes: string | null
  client: { name: string; phone: string }
  service: { name: string; duration_minutes: number }
}

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  FINALIZADO: 'Finalizado',
}

const statusColors: Record<string, string> = {
  PENDENTE: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  CONFIRMADO: 'bg-green-500/10 text-green-400 border-green-500/20',
  FINALIZADO: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const paymentLabels: Record<string, string> = {
  PENDENTE: 'A pagar',
  PAGO: 'Pago online',
  PRESENCIAL: 'Paga presencial',
  PAGO_PRESENCIAL: 'Pago presencial',
  REEMBOLSADO: 'Reembolsado',
}

const paymentColors: Record<string, string> = {
  PENDENTE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  PAGO: 'bg-green-500/10 text-green-400 border-green-500/20',
  PRESENCIAL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PAGO_PRESENCIAL: 'bg-green-500/10 text-green-400 border-green-500/20',
  REEMBOLSADO: 'bg-red-500/10 text-red-400 border-red-500/20',
}

function formatDayLabel(date: Date) {
  if (isToday(date)) return 'Hoje'
  if (isTomorrow(date)) return 'Amanhã'
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
}

function openWhatsApp(phone: string, clientName: string) {
  const cleaned = phone.replace(/\D/g, '')
  const number = cleaned.startsWith('55') ? cleaned : `55${cleaned}`
  const message = encodeURIComponent(`Olá ${clientName}! `)
  window.open(`https://wa.me/${number}?text=${message}`, '_blank')
}

interface MinhaAgendaClientProps {
  barberName: string
  bookings: Booking[]
}

export function MinhaAgendaClient({ barberName, bookings }: MinhaAgendaClientProps) {
  // Group bookings by day
  const grouped = bookings.reduce<Record<string, Booking[]>>((acc, booking) => {
    const key = format(new Date(booking.date_time), 'yyyy-MM-dd')
    if (!acc[key]) acc[key] = []
    acc[key].push(booking)
    return acc
  }, {})

  const sortedDays = Object.keys(grouped).sort()

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold flex items-center gap-2'>
          <CalendarDays className='h-6 w-6 text-amber-600' />
          Minha Agenda
        </h1>
        <p className='text-sm text-zinc-400 mt-1'>
          Próximos agendamentos de <span className='text-white font-medium'>{barberName}</span>
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className='border-zinc-800 bg-zinc-900/50'>
          <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
            <CalendarDays className='h-12 w-12 text-zinc-600 mb-4' />
            <p className='text-zinc-400 font-medium'>Nenhum agendamento próximo</p>
            <p className='text-zinc-500 text-sm mt-1'>
              Seus próximos agendamentos aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {sortedDays.map((day) => (
            <div key={day} className='space-y-3'>
              <h2 className='text-sm font-semibold text-zinc-300 capitalize'>
                {formatDayLabel(new Date(day + 'T12:00:00'))}
              </h2>

              {grouped[day].map((booking) => (
                <Card key={booking.id} className='border-zinc-800 bg-zinc-900/50'>
                  <CardContent className='py-4'>
                    <div className='flex items-start justify-between gap-4 flex-wrap'>
                      {/* Time + Service */}
                      <div className='flex items-start gap-3'>
                        <div className='flex flex-col items-center justify-center rounded-lg bg-zinc-800 px-3 py-2 min-w-[60px] text-center'>
                          <span className='text-lg font-bold text-amber-600 leading-none'>
                            {format(new Date(booking.date_time), 'HH:mm')}
                          </span>
                        </div>
                        <div>
                          <p className='font-medium text-white'>{booking.service.name}</p>
                          <div className='flex items-center gap-1 text-xs text-zinc-400 mt-0.5'>
                            <Clock className='h-3 w-3' />
                            {booking.service.duration_minutes} min
                            {booking.total_price != null && (
                              <span className='ml-2 text-amber-600 font-medium'>
                                R$ {booking.total_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className='flex flex-wrap gap-1.5'>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[booking.status]}`}
                        >
                          {statusLabels[booking.status]}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${paymentColors[booking.payment_status]}`}
                        >
                          {paymentLabels[booking.payment_status]}
                        </span>
                      </div>
                    </div>

                    {/* Client info */}
                    <div className='mt-3 flex items-center justify-between gap-4 rounded-lg bg-zinc-800/50 px-3 py-2'>
                      <div className='flex items-center gap-2'>
                        <div className='flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300'>
                          {booking.client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className='text-sm font-medium text-white'>{booking.client.name}</p>
                          <div className='flex items-center gap-1 text-xs text-zinc-400'>
                            <Phone className='h-3 w-3' />
                            <span className='font-mono'>{booking.client.phone}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-green-500 hover:text-green-400 hover:bg-green-500/10 shrink-0'
                        onClick={() => openWhatsApp(booking.client.phone, booking.client.name)}
                      >
                        <MessageCircle className='h-4 w-4 mr-1.5' />
                        WhatsApp
                      </Button>
                    </div>

                    {booking.notes && (
                      <p className='mt-2 text-xs text-zinc-500 italic'>
                        Obs: {booking.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
