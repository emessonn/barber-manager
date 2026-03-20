import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { SettingsClient } from './_components/SettingsClient'
import { type WorkingHours } from '@/lib/validators'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) return <div>Não autorizado</div>

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.barbershop_id) return <div>Barbearia não encontrada</div>

  const [barbershop, exceptions] = await Promise.all([
    prismaClient.barbershop.findUnique({
      where: { id: user.barbershop_id },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        comission_rate: true,
        logo_url: true,
        working_hours: true,
      },
    }),
    prismaClient.barbershopException.findMany({
      where: { barbershop_id: user.barbershop_id },
      orderBy: { date: 'asc' },
    }),
  ])

  if (!barbershop) return <div>Barbearia não encontrada</div>

  return (
    <SettingsClient
      barbershop={{
        ...barbershop,
        working_hours: barbershop.working_hours as WorkingHours | null,
      }}
      exceptions={exceptions.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        reason: e.reason,
      }))}
    />
  )
}
