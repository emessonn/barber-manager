import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { InventoryClient } from './_components/InventoryClient'

export default async function InventoryPage() {
  const session = await auth()

  if (!session?.user?.id) return <div>Não autorizado</div>

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.barbershop_id) return <div>Barbearia não encontrada</div>

  const items = await prismaClient.inventoryItem.findMany({
    where: { barbershop_id: user.barbershop_id },
    orderBy: { created_at: 'desc' },
  })

  return (
    <InventoryClient
      items={items}
      barbershop_id={user.barbershop_id}
    />
  )
}
