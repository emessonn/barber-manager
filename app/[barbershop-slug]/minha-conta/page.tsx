import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prismaClient } from '@/lib/prisma'
import { getClientSession } from '@/lib/client-session'
import { CLIENT_SESSION_COOKIE } from '@/lib/client-session'
import { MyBookingsClient } from './_components/MyBookingsClient'

interface Props {
  params: Promise<{ 'barbershop-slug': string }>
}

export default async function MinhaContaPage({ params }: Props) {
  const { 'barbershop-slug': slug } = await params

  const barbershop = await prismaClient.barbershop.findUnique({
    where: { slug },
    select: { id: true, name: true, logo_url: true, phone: true },
  })

  if (!barbershop) redirect('/')

  const session = await getClientSession()

  if (!session || session.barbershop_id !== barbershop.id) {
    redirect(`/${slug}/minha-conta/login`)
  }

  const bookings = await prismaClient.booking.findMany({
    where: { client_id: session.client_id },
    include: {
      barber: { select: { name: true, avatar_url: true } },
      service: { select: { name: true, price: true, duration_minutes: true } },
    },
    orderBy: { date_time: 'desc' },
  })

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(CLIENT_SESSION_COOKIE)?.value ?? ''

  return (
    <div className='min-h-screen bg-zinc-950 text-white'>
      <MyBookingsClient
        client={session.client}
        bookings={bookings}
        barbershop={barbershop}
        slug={slug}
        sessionToken={sessionToken}
      />
    </div>
  )
}
