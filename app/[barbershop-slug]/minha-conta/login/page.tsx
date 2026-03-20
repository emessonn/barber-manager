import { redirect } from 'next/navigation'
import { prismaClient } from '@/lib/prisma'
import { getClientSession } from '@/lib/client-session'
import { LoginForm } from './_components/LoginForm'

interface Props {
  params: Promise<{ 'barbershop-slug': string }>
}

export default async function ClientLoginPage({ params }: Props) {
  const { 'barbershop-slug': slug } = await params

  const session = await getClientSession()
  if (session && session.barbershop_id) {
    const barbershop = await prismaClient.barbershop.findUnique({
      where: { id: session.barbershop_id },
      select: { slug: true },
    })
    if (barbershop?.slug === slug) {
      redirect(`/${slug}/minha-conta`)
    }
  }

  const barbershop = await prismaClient.barbershop.findUnique({
    where: { slug },
    select: { id: true, name: true, logo_url: true },
  })

  if (!barbershop) {
    redirect('/')
  }

  return (
    <div className='min-h-screen bg-zinc-950 flex items-center justify-center p-4'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='text-center space-y-2'>
          {barbershop.logo_url && (
            <img
              src={barbershop.logo_url}
              alt={barbershop.name}
              className='w-16 h-16 rounded-full mx-auto object-cover'
            />
          )}
          <h1 className='text-2xl font-bold text-white'>{barbershop.name}</h1>
          <p className='text-zinc-400 text-sm'>Acesse seus agendamentos</p>
        </div>

        <LoginForm barbershop_id={barbershop.id} slug={slug} />
      </div>
    </div>
  )
}
