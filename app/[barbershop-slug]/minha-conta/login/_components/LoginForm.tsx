'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginWithPhone } from '@/actions/client-auth'

interface Props {
  barbershop_id: string
  slug: string
}

export function LoginForm({ barbershop_id, slug }: Props) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      let formatted = cleaned
      if (cleaned.length > 2) formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
      if (cleaned.length > 7) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
      }
      setPhone(formatted)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await loginWithPhone(phone, barbershop_id)

    if (!result.success) {
      setError(result.error || 'Erro ao fazer login.')
      setLoading(false)
    } else {
      router.push(`/${slug}/minha-conta`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-zinc-300 mb-1'>
          Telefone cadastrado
        </label>
        <Input
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder='(XX) XXXXX-XXXX'
          required
          className='text-center text-lg tracking-widest'
        />
        <p className='text-xs text-zinc-500 mt-1'>
          Use o mesmo telefone informado no agendamento
        </p>
      </div>

      {error && <p className='text-sm text-red-400 text-center'>{error}</p>}

      <Button type='submit' className='w-full' disabled={loading || phone.length < 14}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
