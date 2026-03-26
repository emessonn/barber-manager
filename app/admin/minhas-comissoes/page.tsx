import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { MinhasComissoesClient } from './_components/MinhasComissoesClient'

export default async function MinhasComissoesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, barbershop_id: true, barber: { select: { id: true, name: true } } },
  })

  if (user?.role !== 'BARBER') {
    redirect('/admin/dashboard')
  }

  if (!user.barbershop_id) redirect('/login')

  const barber = user.barber
  if (!barber) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-center p-6'>
        <p className='text-zinc-400 text-lg font-medium'>Perfil de barbeiro não vinculado</p>
        <p className='text-zinc-500 text-sm mt-2'>
          Peça ao administrador para vincular seu usuário a um barbeiro.
        </p>
      </div>
    )
  }

  // Bookings that generated commission (FINALIZADO or confirmed payment)
  const paidBookings = await prismaClient.booking.findMany({
    where: {
      barber_id: barber.id,
      status: 'FINALIZADO',
      payment_status: { in: ['PAGO', 'PAGO_PRESENCIAL'] },
    },
    select: {
      id: true,
      date_time: true,
      total_price: true,
      payment_status: true,
      client: { select: { name: true } },
      service: { select: { name: true } },
      commissions: { select: { amount: true, percentage: true } },
    },
    orderBy: { date_time: 'desc' },
    take: 100,
  })

  // Pending commissions (finalized but not paid yet, or confirmed bookings)
  const pendingBookings = await prismaClient.booking.findMany({
    where: {
      barber_id: barber.id,
      status: { in: ['CONFIRMADO', 'FINALIZADO'] },
      payment_status: { in: ['PENDENTE', 'PRESENCIAL'] },
    },
    select: {
      id: true,
      date_time: true,
      total_price: true,
      status: true,
      payment_status: true,
      client: { select: { name: true } },
      service: { select: { name: true } },
      commissions: { select: { amount: true, percentage: true } },
    },
    orderBy: { date_time: 'desc' },
    take: 100,
  })

  return (
    <MinhasComissoesClient
      barberName={barber.name}
      paidBookings={paidBookings}
      pendingBookings={pendingBookings}
    />
  )
}
