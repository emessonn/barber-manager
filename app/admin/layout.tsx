import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, barbershop_id: true },
  })

  if (!user?.barbershop_id) {
    redirect('/onboarding')
  }

  if (user.role !== 'ADMIN') {
    redirect('/login')
  }

  const barbershop = await prismaClient.barbershop.findUnique({
    where: { id: user.barbershop_id },
    select: { name: true, logo_url: true },
  })

  return (
    <div className='flex min-h-screen bg-zinc-950'>
      <Sidebar
        barbershopName={barbershop?.name}
        barbershopLogo={barbershop?.logo_url}
      />
      <main className='flex-1 overflow-auto pt-[52px] md:pt-0'>{children}</main>
    </div>
  )
}
