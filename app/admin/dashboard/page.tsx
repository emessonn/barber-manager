import React from 'react'
import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDateBR } from '@/lib/utils'
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Banknote,
  Clock,
  RefreshCw,
  Hourglass,
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()

  if (!session || !session?.user?.id) {
    return <div>Não autorizado</div>
  }

  // Buscar usuário para obter barbershop_id
  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user || !user.barbershop_id) {
    return <div>Barbearia não encontrada</div>
  }

  const barbershop_id = user.barbershop_id

  // Buscar métricas
  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  const [
    revenueRecords,
    predictedBookings,
    totalCommissions,
    todayBookings,
    totalClients,
    recentBookings,
  ] = await Promise.all([
    // Receita real: entradas manuais + entradas de bookings com pagamento confirmado
    prismaClient.financialRecord.findMany({
      where: {
        barbershop_id,
        type: 'ENTRADA',
        created_at: { gte: yearStart },
        OR: [
          { booking_id: null },
          {
            booking: {
              payment_status: { in: ['PAGO', 'PAGO_PRESENCIAL'] },
            },
          },
        ],
      },
      select: { amount: true },
    }),
    // Saldo previsto: agendamentos confirmados sem pagamento efetuado no ano
    prismaClient.booking.findMany({
      where: {
        barbershop_id,
        status: { in: ['CONFIRMADO', 'FINALIZADO'] },
        payment_status: { in: ['PENDENTE', 'PRESENCIAL'] },
        date_time: { gte: yearStart },
      },
      select: { total_price: true, service: { select: { price: true } } },
    }),
    prismaClient.commission.aggregate({
      where: {
        barbershop_id,
        computed_at: { gte: yearStart },
      },
      _sum: { amount: true },
    }),
    prismaClient.booking.count({
      where: {
        barber: { barbershop_id },
        date_time: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prismaClient.client.count({
      where: { barbershop_id },
    }),
    prismaClient.booking.findMany({
      where: { barber: { barbershop_id } },
      select: {
        id: true,
        date_time: true,
        status: true,
        payment_status: true,
        total_price: true,
        client: { select: { name: true } },
        barber: { select: { name: true } },
        service: { select: { name: true, price: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
  ])

  const revenue = revenueRecords.reduce((sum, r) => sum + r.amount, 0)
  const predictedRevenue = predictedBookings.reduce(
    (sum, b) => sum + (b.total_price ?? b.service.price),
    0,
  )
  const commissions = totalCommissions._sum.amount || 0

  const PAYMENT_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    PENDENTE:         { label: 'Pendente',              className: 'bg-zinc-700/50 text-zinc-400',   icon: <Clock className='h-3 w-3' /> },
    PAGO:             { label: 'Pago Online',            className: 'bg-green-600/20 text-green-400', icon: <CreditCard className='h-3 w-3' /> },
    PRESENCIAL:       { label: 'Pagar na Barbearia',    className: 'bg-blue-600/20 text-blue-400',   icon: <Banknote className='h-3 w-3' /> },
    PAGO_PRESENCIAL:  { label: 'Pago Presencialmente',  className: 'bg-green-600/20 text-green-400', icon: <Banknote className='h-3 w-3' /> },
    REEMBOLSADO:      { label: 'Reembolsado',           className: 'bg-red-600/20 text-red-400',     icon: <RefreshCw className='h-3 w-3' /> },
  }

  const STATUS_CONFIG: Record<string, string> = {
    CONFIRMADO: 'bg-green-500/15 text-green-400',
    PENDENTE:   'bg-yellow-500/15 text-yellow-400',
    CANCELADO:  'bg-red-500/15 text-red-400',
    FINALIZADO: 'bg-zinc-600/40 text-zinc-400',
  }

  return (
    <div className='space-y-8 p-8 md:p-12'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-zinc-400'>
          Bem-vindo de volta! Aqui está seu resumo.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Faturamento Real (Ano)
            </CardTitle>
            <DollarSign className='h-4 w-4 text-amber-600' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{formatCurrency(revenue)}</p>
            <p className='text-xs text-zinc-500'>Pagamentos confirmados</p>
          </CardContent>
        </Card>

        <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur border-dashed'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Previsto (Ano)
            </CardTitle>
            <Hourglass className='h-4 w-4 text-blue-400' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-blue-400'>{formatCurrency(predictedRevenue)}</p>
            <p className='text-xs text-zinc-500'>Agendados sem pagamento</p>
          </CardContent>
        </Card>

        <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Comissões (Ano)
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-amber-600' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{formatCurrency(commissions)}</p>
            <p className='text-xs text-zinc-500'>Total de comissões</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Agendamentos Hoje
            </CardTitle>
            <Calendar className='h-4 w-4 text-amber-600' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{todayBookings}</p>
            <p className='text-xs text-zinc-500'>Confirmados</p>
          </CardContent>
        </Card>

        <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total de Clientes
            </CardTitle>
            <Users className='h-4 w-4 text-amber-600' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{totalClients}</p>
            <p className='text-xs text-zinc-500'>Cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Calendar className='h-5 w-5 text-amber-600' />
            <span>Agendamentos Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className='flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0'
                >
                  <div className='space-y-1'>
                    <p className='font-medium'>{booking.client.name}</p>
                    <p className='text-sm text-zinc-400'>
                      {booking.service.name} - {booking.barber.name}
                    </p>
                    <p className='text-xs text-zinc-500'>
                      {formatDateBR(booking.date_time)}
                    </p>
                  </div>
                  <div className='flex flex-col items-end gap-1.5'>
                    <p className='font-semibold text-amber-600'>
                      {formatCurrency(booking.total_price ?? booking.service.price)}
                    </p>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_CONFIG[booking.status] ?? 'bg-amber-600/20 text-amber-600'}`}>
                      {booking.status}
                    </span>
                    {(() => {
                      const p = PAYMENT_CONFIG[booking.payment_status]
                      return p ? (
                        <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${p.className}`}>
                          {p.icon}
                          {p.label}
                        </span>
                      ) : null
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <p className='text-sm text-zinc-400'>
                Nenhum agendamento encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
