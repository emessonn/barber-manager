'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, Scissors, User, LogOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cancelMyBooking, signOutClient } from '@/actions/client-auth'
import { formatCurrency } from '@/lib/utils'

type BookingStatus = 'PENDENTE' | 'CONFIRMADO' | 'FINALIZADO' | 'CANCELADO'

interface Booking {
  id: string
  date_time: Date
  status: BookingStatus
  total_price: number | null
  barber: { name: string; avatar_url: string | null }
  service: { name: string; price: number; duration_minutes: number }
}

interface Props {
  client: { name: string; phone: string; email: string | null }
  bookings: Booking[]
  barbershop: { name: string; logo_url: string | null; phone: string }
  slug: string
  sessionToken: string
}

const statusConfig: Record<BookingStatus, { label: string; color: string }> = {
  PENDENTE: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-400/10' },
  CONFIRMADO: { label: 'Confirmado', color: 'text-green-400 bg-green-400/10' },
  FINALIZADO: { label: 'Finalizado', color: 'text-zinc-400 bg-zinc-400/10' },
  CANCELADO: { label: 'Cancelado', color: 'text-red-400 bg-red-400/10' },
}

export function MyBookingsClient({ client, bookings, barbershop, slug, sessionToken }: Props) {
  const router = useRouter()
  const [localBookings, setLocalBookings] = useState(bookings)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const upcoming = localBookings.filter(
    (b) => new Date(b.date_time) >= new Date() && b.status !== 'CANCELADO',
  )
  const past = localBookings.filter(
    (b) => new Date(b.date_time) < new Date() || b.status === 'CANCELADO',
  )

  const handleCancel = async (booking_id: string) => {
    setCancellingId(booking_id)

    const result = await cancelMyBooking(booking_id, sessionToken)

    if (result.success) {
      setLocalBookings((prev) =>
        prev.map((b) => (b.id === booking_id ? { ...b, status: 'CANCELADO' as const } : b)),
      )
    } else {
      alert(result.error || 'Erro ao cancelar.')
    }

    setCancellingId(null)
  }

  const handleSignOut = async () => {
    await signOutClient()
    router.push(`/${slug}`)
    router.refresh()
  }

  return (
    <div className='max-w-lg mx-auto px-4 pb-10'>
      {/* Header */}
      <div className='flex items-center justify-between py-5 border-b border-zinc-800'>
        <div className='flex items-center gap-3'>
          {barbershop.logo_url && (
            <img
              src={barbershop.logo_url}
              alt={barbershop.name}
              className='w-9 h-9 rounded-full object-cover'
            />
          )}
          <div>
            <p className='text-xs text-zinc-500'>Minha Conta</p>
            <p className='font-semibold text-sm'>{barbershop.name}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className='flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors'
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>

      {/* Client info */}
      <div className='py-4 border-b border-zinc-800'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center font-bold text-sm'>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className='font-medium'>{client.name}</p>
            <p className='text-sm text-zinc-400'>{client.phone}</p>
          </div>
        </div>
      </div>

      {/* New booking CTA */}
      <div className='mt-5'>
        <a href={`/${slug}`}>
          <Button className='w-full bg-amber-600 hover:bg-amber-500 text-black font-semibold'>
            + Novo agendamento
          </Button>
        </a>
      </div>

      {/* Upcoming bookings */}
      <div className='mt-6'>
        <h2 className='text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3'>
          Próximos agendamentos
        </h2>

        {upcoming.length === 0 ? (
          <div className='text-center py-8 text-zinc-500 text-sm'>
            Nenhum agendamento futuro.{' '}
            <a href={`/${slug}`} className='text-amber-500 hover:underline'>
              Agendar agora
            </a>
          </div>
        ) : (
          <div className='space-y-3'>
            {upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                cancellingId={cancellingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past bookings */}
      {past.length > 0 && (
        <div className='mt-8'>
          <h2 className='text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3'>
            Histórico
          </h2>
          <div className='space-y-3'>
            {past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function BookingCard({
  booking,
  onCancel,
  cancellingId,
}: {
  booking: Booking
  onCancel?: (id: string) => void
  cancellingId?: string | null
}) {
  const status = statusConfig[booking.status]
  const isPast = new Date(booking.date_time) < new Date()
  const canCancel = onCancel && !isPast && booking.status !== 'CANCELADO' && booking.status !== 'FINALIZADO'

  return (
    <Card className='border-zinc-800 bg-zinc-900/60'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-2 flex-1'>
            <div className='flex items-center gap-2'>
              <Scissors size={14} className='text-amber-500 shrink-0' />
              <span className='font-medium text-sm'>{booking.service.name}</span>
            </div>
            <div className='flex items-center gap-2 text-zinc-400 text-xs'>
              <User size={13} />
              <span>{booking.barber.name}</span>
            </div>
            <div className='flex items-center gap-2 text-zinc-400 text-xs'>
              <Calendar size={13} />
              <span>
                {format(new Date(booking.date_time), "dd 'de' MMMM", { locale: ptBR })}
              </span>
              <Clock size={13} className='ml-1' />
              <span>{format(new Date(booking.date_time), 'HH:mm')}</span>
            </div>
          </div>

          <div className='flex flex-col items-end gap-2'>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
              {status.label}
            </span>
            <span className='text-sm font-semibold text-amber-500'>
              {formatCurrency(booking.total_price ?? booking.service.price)}
            </span>
          </div>
        </div>

        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={cancellingId === booking.id}
                className='mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50'
              >
                <X size={13} />
                {cancellingId === booking.id ? 'Cancelando...' : 'Cancelar agendamento'}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar agendamento</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja cancelar o agendamento de{' '}
                  <span className='font-medium text-white'>{booking.service.name}</span> com{' '}
                  <span className='font-medium text-white'>{booking.barber.name}</span>?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onCancel(booking.id)}
                  className='bg-red-600 hover:bg-red-700 text-white'
                >
                  Sim, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  )
}
