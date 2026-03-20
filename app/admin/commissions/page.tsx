import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDateBR } from '@/lib/utils'
import { Percent, TrendingUp } from 'lucide-react'

export default async function CommissionsPage() {
  const session = await auth()

  if (!session?.user?.id) return <div>Não autorizado</div>

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.barbershop_id) return <div>Barbearia não encontrada</div>

  const barbershop_id = user.barbershop_id

  const [commissions, barbers] = await Promise.all([
    prismaClient.commission.findMany({
      where: { barbershop_id },
      include: {
        barber: { select: { id: true, name: true } },
        service: { select: { name: true } },
        booking: { select: { date_time: true, client: { select: { name: true } } } },
      },
      orderBy: { computed_at: 'desc' },
    }),
    prismaClient.barber.findMany({
      where: { barbershop_id, is_active: true },
      select: { id: true, name: true },
    }),
  ])

  // Agrupar comissões por barbeiro
  const byBarber = barbers.map((barber) => {
    const barberCommissions = commissions.filter(
      (c) => c.barber.id === barber.id,
    )
    const total = barberCommissions.reduce((sum, c) => sum + c.amount, 0)
    return { barber, commissions: barberCommissions, total }
  })

  const grandTotal = commissions.reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className='space-y-8 p-8 md:p-12'>
      <div>
        <h1 className='text-3xl font-bold'>Comissões</h1>
        <p className='text-zinc-400'>Acompanhe as comissões dos barbeiros</p>
      </div>

      {/* Total */}
      <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium'>
            Total de Comissões (Geral)
          </CardTitle>
          <TrendingUp className='h-4 w-4 text-amber-600' />
        </CardHeader>
        <CardContent>
          <p className='text-2xl font-bold text-amber-600'>
            {formatCurrency(grandTotal)}
          </p>
        </CardContent>
      </Card>

      {/* Por Barbeiro */}
      {byBarber.length === 0 ? (
        <Card className='border-zinc-700 bg-zinc-900/50'>
          <CardContent className='p-8 text-center'>
            <p className='text-zinc-400'>Nenhuma comissão registrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {byBarber.map(({ barber, commissions: barberComms, total }) => (
            <Card
              key={barber.id}
              className='border-zinc-700 bg-zinc-900/50 backdrop-blur'
            >
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-amber-600/20 text-amber-600 text-xs font-bold'>
                      {barber.name.charAt(0).toUpperCase()}
                    </div>
                    {barber.name}
                  </CardTitle>
                  <div className='text-right'>
                    <p className='text-sm text-zinc-400'>Total</p>
                    <p className='font-bold text-amber-600'>
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              {barberComms.length > 0 && (
                <CardContent className='p-0'>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='border-b border-zinc-800 text-left text-zinc-400'>
                          <th className='px-4 py-3 font-medium'>Cliente</th>
                          <th className='px-4 py-3 font-medium'>Serviço</th>
                          <th className='px-4 py-3 font-medium'>Data</th>
                          <th className='px-4 py-3 font-medium'>%</th>
                          <th className='px-4 py-3 font-medium'>Comissão</th>
                        </tr>
                      </thead>
                      <tbody>
                        {barberComms.map((commission) => (
                          <tr
                            key={commission.id}
                            className='border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30'
                          >
                            <td className='px-4 py-3'>
                              {commission.booking?.client?.name ?? '-'}
                            </td>
                            <td className='px-4 py-3'>
                              {commission.service.name}
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap text-zinc-400'>
                              {commission.booking?.date_time
                                ? formatDateBR(commission.booking.date_time)
                                : '-'}
                            </td>
                            <td className='px-4 py-3 text-zinc-400'>
                              <span className='flex items-center gap-1'>
                                <Percent className='h-3 w-3' />
                                {commission.percentage}
                              </span>
                            </td>
                            <td className='px-4 py-3 font-medium text-amber-600'>
                              {formatCurrency(commission.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
              {barberComms.length === 0 && (
                <CardContent>
                  <p className='text-sm text-zinc-500'>
                    Nenhuma comissão registrada para este barbeiro.
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
