'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Scissors, Loader2, AlertCircle } from 'lucide-react'

export default function StaffLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      login: form.get('login'),
      password: form.get('password'),
      barbershopSlug: form.get('barbershopSlug'),
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      setError('Login ou senha inválidos. Verifique os dados e tente novamente.')
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-900 px-4'>
      <Card className='w-full max-w-sm border-zinc-700 bg-zinc-900/50 backdrop-blur'>
        <CardHeader className='space-y-4 text-center'>
          <div className='flex justify-center'>
            <div className='rounded-lg bg-amber-600/10 p-3'>
              <Scissors className='h-8 w-8 text-amber-600' />
            </div>
          </div>
          <CardTitle className='text-2xl'>Acesso da Equipe</CardTitle>
          <p className='text-sm text-zinc-400'>
            Entre com seu login de barbeiro ou recepção
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='barbershopSlug'>URL da Barbearia</Label>
              <Input
                id='barbershopSlug'
                name='barbershopSlug'
                type='text'
                placeholder='minha-barbearia'
                required
                className='border-zinc-700 bg-zinc-800/50'
              />
              <p className='text-xs text-zinc-500'>
                O slug da barbearia (ex: barbearia-do-joao)
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='login'>Login</Label>
              <Input
                id='login'
                name='login'
                type='text'
                placeholder='seu.login'
                required
                className='border-zinc-700 bg-zinc-800/50'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Senha</Label>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='••••••••'
                required
                className='border-zinc-700 bg-zinc-800/50'
              />
            </div>

            {error && (
              <div className='flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400'>
                <AlertCircle className='h-4 w-4 flex-shrink-0' />
                {error}
              </div>
            )}

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full bg-amber-600 hover:bg-amber-500 text-black font-semibold'
              size='lg'
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <p className='mt-4 text-center text-xs text-zinc-500'>
            É dono da barbearia?{' '}
            <a href='/login' className='text-amber-600 hover:underline'>
              Entrar com Google
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
