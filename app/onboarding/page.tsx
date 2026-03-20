import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scissors } from 'lucide-react'
import { OnboardingForm } from './_components/OnboardingForm'

export default async function OnboardingPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Already has a barbershop → go to dashboard
  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
    select: { barbershop_id: true, name: true },
  })

  if (user?.barbershop_id) {
    redirect('/admin/dashboard')
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-900 px-4 py-12'>
      <div className='w-full max-w-lg space-y-6'>
        {/* Header */}
        <div className='text-center space-y-3'>
          <div className='flex justify-center'>
            <div className='rounded-xl bg-amber-600/10 p-4 ring-1 ring-amber-600/20'>
              <Scissors className='h-8 w-8 text-amber-600' />
            </div>
          </div>
          <div>
            <h1 className='text-2xl font-bold text-white'>
              {user?.name ? `Olá, ${user.name.split(' ')[0]}!` : 'Bem-vindo!'}
            </h1>
            <p className='mt-1 text-zinc-400'>
              Vamos configurar sua barbearia. Leva menos de 2 minutos.
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className='flex items-center gap-2 justify-center text-xs text-zinc-500'>
          <span className='flex items-center gap-1.5'>
            <span className='flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-black font-bold text-[10px]'>
              1
            </span>
            Conta Google
          </span>
          <span className='flex-1 h-px bg-amber-600/50 max-w-[40px]' />
          <span className='flex items-center gap-1.5'>
            <span className='flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-black font-bold text-[10px]'>
              2
            </span>
            Sua Barbearia
          </span>
          <span className='flex-1 h-px bg-zinc-700 max-w-[40px]' />
          <span className='flex items-center gap-1.5 opacity-50'>
            <span className='flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 text-zinc-500 font-bold text-[10px]'>
              3
            </span>
            Dashboard
          </span>
        </div>

        {/* Form card */}
        <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-lg'>Dados da Barbearia</CardTitle>
          </CardHeader>
          <CardContent>
            <OnboardingForm userName={user?.name} />
          </CardContent>
        </Card>

        <p className='text-center text-xs text-zinc-600'>
          Você pode alterar estas informações depois nas configurações.
        </p>
      </div>
    </main>
  )
}
