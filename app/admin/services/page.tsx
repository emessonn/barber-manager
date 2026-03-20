import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { ServicesClient } from './_components/ServicesClient'

export default async function ServicesPage() {
  const session = await auth()

  if (!session?.user?.id) return <div>Não autorizado</div>

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.barbershop_id) return <div>Barbearia não encontrada</div>

  const services = await prismaClient.service.findMany({
    where: { barbershop_id: user.barbershop_id },
    orderBy: { created_at: 'desc' },
  })

  return (
    <ServicesClient
      services={services}
      barbershop_id={user.barbershop_id}
    />
  )
}
