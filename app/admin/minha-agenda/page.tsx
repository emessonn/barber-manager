import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { MinhaAgendaClient } from './_components/MinhaAgendaClient'

export default async function MinhaAgendaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, barbershop_id: true, barber: { select: { id: true, name: true } } },
  })

  // Only BARBER role can access this page
  if (user?.role !== 'BARBER') {
    redirect('/admin/dashboard')
  }

  if (!user.barbershop_id) redirect('/login')

  // Get the barber linked to this user
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const bookings = await prismaClient.booking.findMany({
    where: {
      barber_id: barber.id,
      date_time: { gte: today },
      status: { notIn: ['CANCELADO'] },
    },
    select: {
      id: true,
      date_time: true,
      status: true,
      payment_status: true,
      total_price: true,
      notes: true,
      client: { select: { name: true, phone: true } },
      service: { select: { name: true, duration_minutes: true } },
    },
    orderBy: { date_time: 'asc' },
  })

  return <MinhaAgendaClient barberName={barber.name} bookings={bookings} />
}
