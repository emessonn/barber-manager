import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scissors, Calendar, BarChart3, Users } from 'lucide-react'
import { signIn } from '@/lib/auth'

async function SignInButton({
  size = 'default',
  className,
  label,
}: {
  size?: 'default' | 'lg' | 'sm'
  className?: string
  label: string
}) {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('google', { redirectTo: '/onboarding' })
      }}
    >
      <Button type='submit' size={size} className={className}>
        {label}
      </Button>
    </form>
  )
}

export default function Home() {
  return (
    <main className='min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900'>
      {/* Header */}
      <header className='border-b border-zinc-800 bg-zinc-900/50 backdrop-blur'>
        <div className='container mx-auto flex items-center justify-between px-4 py-6'>
          <div className='flex items-center space-x-2'>
            <Scissors className='h-8 w-8 text-amber-600' />
            <h1 className='text-2xl font-bold gradient-text'>BarberManager</h1>
          </div>
          <nav className='space-x-4 flex items-center'>
            <Link href='/login'>
              <Button variant='ghost'>Login</Button>
            </Link>
            <SignInButton
              label='Começar Agora'
              className='bg-amber-600 hover:bg-amber-500 text-black font-semibold'
            />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className='container mx-auto space-y-8 px-4 py-20'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-5xl font-bold tracking-tight text-white mb-6'>
            Gerenciamento Premium para sua Barbearia
          </h2>
          <p className='mb-8 text-xl text-zinc-400'>
            Organize agendamentos, gerencie finanças e acompanhe seus clientes
            com um sistema moderno e intuitivo
          </p>
          <SignInButton
            size='lg'
            label='Teste Grátis por 14 Dias'
            className='bg-amber-600 hover:bg-amber-500 text-black font-semibold'
          />
        </div>

        {/* Features Grid */}
        <div className='mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
            <CardHeader>
              <Calendar className='mb-4 h-8 w-8 text-amber-600' />
              <CardTitle className='text-lg'>Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-zinc-400'>
                Sistema inteligente de agendamentos com bloqueio automático de
                horários
              </p>
            </CardContent>
          </Card>

          <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
            <CardHeader>
              <BarChart3 className='mb-4 h-8 w-8 text-amber-600' />
              <CardTitle className='text-lg'>Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-zinc-400'>
                Controle completo de receitas, despesas e comissões dos
                barbeiros
              </p>
            </CardContent>
          </Card>

          <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
            <CardHeader>
              <Users className='mb-4 h-8 w-8 text-amber-600' />
              <CardTitle className='text-lg'>CRM</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-zinc-400'>
                Histórico de clientes, preferências e fidelidade em um único
                lugar
              </p>
            </CardContent>
          </Card>

          <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
            <CardHeader>
              <Scissors className='mb-4 h-8 w-8 text-amber-600' />
              <CardTitle className='text-lg'>Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-zinc-400'>
                Monitore produtos com alertas de estoque mínimo automáticos
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-zinc-800 bg-zinc-900/50 backdrop-blur py-12'>
        <div className='container mx-auto text-center px-4'>
          <p className='text-zinc-400'>
            © 2024 BarberManager. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  )
}
