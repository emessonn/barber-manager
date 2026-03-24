import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { FinancesClient } from './_components/FinancesClient'

export default async function FinancesPage() {
  const session = await auth()

  if (!session?.user?.id) return <div>Não autorizado</div>

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.barbershop_id) return <div>Barbearia não encontrada</div>

  const barbershop_id = user.barbershop_id

  // Receitas reais: somente FinancialRecords vinculados a bookings pagos
  // (PAGO via MercadoPago ou PAGO_PRESENCIAL confirmado pelo admin)
  // ou entradas manuais (sem booking_id)
  const [records, incomeAgg, expenseAgg, predictedBookings] = await Promise.all([
    prismaClient.financialRecord.findMany({
      where: { barbershop_id },
      orderBy: { created_at: 'desc' },
    }),
    // Receita real: entradas manuais + entradas de bookings pagos
    prismaClient.financialRecord.findMany({
      where: {
        barbershop_id,
        type: 'ENTRADA',
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
    prismaClient.financialRecord.aggregate({
      where: { barbershop_id, type: 'SAIDA' },
      _sum: { amount: true },
    }),
    // Saldo previsto: agendamentos confirmados/finalizados sem pagamento efetuado
    prismaClient.booking.findMany({
      where: {
        barbershop_id,
        status: { in: ['CONFIRMADO', 'FINALIZADO'] },
        payment_status: { in: ['PENDENTE', 'PRESENCIAL'] },
      },
      select: { total_price: true, service: { select: { price: true } } },
    }),
  ])

  const totalIncome = incomeAgg.reduce((sum, r) => sum + r.amount, 0)
  const totalExpense = expenseAgg._sum.amount ?? 0
  const predictedRevenue = predictedBookings.reduce(
    (sum, b) => sum + (b.total_price ?? b.service.price),
    0,
  )

  return (
    <FinancesClient
      records={records}
      barbershop_id={barbershop_id}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      predictedRevenue={predictedRevenue}
    />
  )
}
