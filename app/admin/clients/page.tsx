import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { getClientsWithStats } from '@/actions/clients'
import { ClientsClient } from './_components/ClientsClient'

export default async function ClientsPage() {
  const session = await auth()

  if (!session?.user?.id) return <div>Não autorizado</div>

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.barbershop_id) return <div>Barbearia não encontrada</div>

  const clients = await getClientsWithStats(user.barbershop_id)

  return <ClientsClient clients={clients} />
}
