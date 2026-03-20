import { signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scissors } from 'lucide-react'

export default function LoginPage() {
  return (
    <main className='flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-900 px-4'>
      <Card className='w-full max-w-sm border-zinc-700 bg-zinc-900/50 backdrop-blur'>
        <CardHeader className='space-y-4 text-center'>
          <div className='flex justify-center'>
            <div className='rounded-lg bg-amber-600/10 p-3'>
              <Scissors className='h-8 w-8 text-amber-600' />
            </div>
          </div>
          <CardTitle className='text-2xl'>BarberManager</CardTitle>
          <p className='text-sm text-zinc-400'>
            Faça login para acessar sua barbearia
          </p>
        </CardHeader>

        <CardContent className='space-y-4'>
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/admin/dashboard' })
            }}
          >
            <Button
              type='submit'
              className='w-full bg-amber-600 hover:bg-amber-500 text-black font-semibold'
              size='lg'
            >
              Entrar com Google
            </Button>
          </form>

          <p className='text-center text-xs text-zinc-500'>
            Ao fazer login, você concorda com nossos Termos de Serviço
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
