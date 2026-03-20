import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { BarbersClient } from './_components/BarbersClient'

export default async function BarbersPage() {
  const session = await auth()

  if (!session?.user?.id) return <div>Não autorizado</div>

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.barbershop_id) return <div>Barbearia não encontrada</div>

  const [barbers, services] = await Promise.all([
    prismaClient.barber.findMany({
      where: { barbershop_id: user.barbershop_id },
      include: {
        services: {
          select: { id: true, name: true, price: true, duration_minutes: true },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    prismaClient.service.findMany({
      where: { barbershop_id: user.barbershop_id, is_active: true },
      select: { id: true, name: true, price: true, duration_minutes: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <BarbersClient
      barbers={barbers}
      services={services}
      barbershop_id={user.barbershop_id}
    />
  )
}
