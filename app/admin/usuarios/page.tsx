import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getStaffUsers } from '@/actions/staff-users'
import { UsuariosClient } from './_components/UsuariosClient'

export default async function UsuariosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, barbershop_id: true },
  })

  if (user?.role !== 'ADMIN') {
    redirect('/admin/dashboard')
  }

  if (!user.barbershop_id) redirect('/onboarding')

  const [staffResult, barbers, barbershop] = await Promise.all([
    getStaffUsers(),
    prismaClient.barber.findMany({
      where: { barbershop_id: user.barbershop_id, is_active: true },
      select: { id: true, name: true, user_id: true },
      orderBy: { name: 'asc' },
    }),
    prismaClient.barbershop.findUnique({
      where: { id: user.barbershop_id },
      select: { slug: true },
    }),
  ])

  const staffUsers = staffResult.success ? staffResult.users ?? [] : []

  return (
    <UsuariosClient
      staffUsers={staffUsers}
      barbers={barbers}
      barbershopSlug={barbershop?.slug ?? ''}
    />
  )
}
