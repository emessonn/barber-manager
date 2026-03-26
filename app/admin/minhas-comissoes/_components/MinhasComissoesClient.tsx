'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Percent, TrendingUp, Clock, CheckCircle } from 'lucide-react'

type BookingItem = {
  id: string
  date_time: Date
  total_price: number | null
  status?: string
  payment_status: string
  client: { name: string }
  service: { name: string }
  commissions: { amount: number; percentage: number }[]
}

interface MinhasComissoesClientProps {
  barberName: string
  paidBookings: BookingItem[]
  pendingBookings: BookingItem[]
}

function getCommissionAmount(booking: BookingItem): number {
  if (booking.commissions.length > 0) {
    return booking.commissions.reduce((sum, c) => sum + c.amount, 0)
  }
  // Fallback: calculate from total_price if no commission record
  return 0
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MinhasComissoesClient({
  barberName,
  paidBookings,
  pendingBookings,
}: MinhasComissoesClientProps) {
  const totalReceived = paidBookings.reduce((sum, b) => sum + getCommissionAmount(b), 0)
  const totalPending = pendingBookings.reduce((sum, b) => sum + getCommissionAmount(b), 0)

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold flex items-center gap-2'>
          <Percent className='h-6 w-6 text-amber-600' />
          Minhas Comissões
        </h1>
        <p className='text-sm text-zinc-400 mt-1'>
          Comissões de <span className='text-white font-medium'>{barberName}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 gap-4'>
        <Card className='border-zinc-800 bg-zinc-900/50'>
          <CardContent className='pt-4 pb-4'>
            <div className='flex items-center gap-2 text-green-400 mb-1'>
              <CheckCircle className='h-4 w-4' />
              <span className='text-xs font-medium uppercase tracking-wide'>Recebido</span>
            </div>
            <p className='text-2xl font-bold text-white'>{formatCurrency(totalReceived)}</p>
            <p className='text-xs text-zinc-500 mt-0.5'>{paidBookings.length} atendimentos pagos</p>
          </CardContent>
        </Card>

        <Card className='border-zinc-800 bg-zinc-900/50'>
          <CardContent className='pt-4 pb-4'>
            <div className='flex items-center gap-2 text-yellow-400 mb-1'>
              <Clock className='h-4 w-4' />
              <span className='text-xs font-medium uppercase tracking-wide'>A Receber</span>
            </div>
            <p className='text-2xl font-bold text-white'>{formatCurrency(totalPending)}</p>
            <p className='text-xs text-zinc-500 mt-0.5'>
              {pendingBookings.length} atendimentos pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='received'>
        <TabsList className='bg-zinc-900 border border-zinc-800'>
          <TabsTrigger value='received' className='data-[state=active]:bg-zinc-800'>
            Recebido ({paidBookings.length})
          </TabsTrigger>
          <TabsTrigger value='pending' className='data-[state=active]:bg-zinc-800'>
            A Receber ({pendingBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='received' className='mt-4 space-y-2'>
          {paidBookings.length === 0 ? (
            <Card className='border-zinc-800 bg-zinc-900/50'>
              <CardContent className='py-10 text-center'>
                <TrendingUp className='h-10 w-10 text-zinc-600 mx-auto mb-3' />
                <p className='text-zinc-400'>Nenhuma comissão recebida ainda</p>
              </CardContent>
            </Card>
          ) : (
            paidBookings.map((booking) => (
              <BookingCommissionRow key={booking.id} booking={booking} isPaid />
            ))
          )}
        </TabsContent>

        <TabsContent value='pending' className='mt-4 space-y-2'>
          {pendingBookings.length === 0 ? (
            <Card className='border-zinc-800 bg-zinc-900/50'>
              <CardContent className='py-10 text-center'>
                <Clock className='h-10 w-10 text-zinc-600 mx-auto mb-3' />
                <p className='text-zinc-400'>Nenhuma comissão pendente</p>
              </CardContent>
            </Card>
          ) : (
            pendingBookings.map((booking) => (
              <BookingCommissionRow key={booking.id} booking={booking} isPaid={false} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BookingCommissionRow({
  booking,
  isPaid,
}: {
  booking: BookingItem
  isPaid: boolean
}) {
  const commissionAmount = getCommissionAmount(booking)
  const commissionPct =
    booking.commissions.length > 0 ? booking.commissions[0].percentage : null

  return (
    <Card className='border-zinc-800 bg-zinc-900/50'>
      <CardContent className='flex items-center justify-between gap-4 py-3'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <p className='text-sm font-medium text-white'>{booking.client.name}</p>
            <span className='text-xs text-zinc-500'>{booking.service.name}</span>
          </div>
          <p className='text-xs text-zinc-400 mt-0.5'>
            {format(new Date(booking.date_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>

        <div className='text-right shrink-0'>
          {commissionAmount > 0 ? (
            <>
              <p
                className={`text-base font-bold ${isPaid ? 'text-green-400' : 'text-yellow-400'}`}
              >
                {formatCurrency(commissionAmount)}
              </p>
              {commissionPct != null && (
                <p className='text-xs text-zinc-500'>{commissionPct}% de comissão</p>
              )}
            </>
          ) : (
            <>
              <p className='text-sm text-zinc-400'>
                {booking.total_price != null
                  ? `Serviço: ${formatCurrency(booking.total_price)}`
                  : '—'}
              </p>
              <p className='text-xs text-zinc-500'>Comissão a calcular</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
