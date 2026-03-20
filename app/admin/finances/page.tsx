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

  const [records, incomeAgg, expenseAgg] = await Promise.all([
    prismaClient.financialRecord.findMany({
      where: { barbershop_id },
      orderBy: { created_at: 'desc' },
    }),
    prismaClient.financialRecord.aggregate({
      where: { barbershop_id, type: 'ENTRADA' },
      _sum: { amount: true },
    }),
    prismaClient.financialRecord.aggregate({
      where: { barbershop_id, type: 'SAIDA' },
      _sum: { amount: true },
    }),
  ])

  return (
    <FinancesClient
      records={records}
      barbershop_id={barbershop_id}
      totalIncome={incomeAgg._sum.amount ?? 0}
      totalExpense={expenseAgg._sum.amount ?? 0}
    />
  )
}
