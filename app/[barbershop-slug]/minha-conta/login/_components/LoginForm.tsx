'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestOtp, verifyOtp } from '@/actions/client-auth'

interface Props {
  barbershop_id: string
  slug: string
}

export function LoginForm({ barbershop_id, slug }: Props) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devOtp, setDevOtp] = useState<string | undefined>()

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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await requestOtp(phone, barbershop_id)

    if (!result.success) {
      setError(result.error || 'Erro ao enviar código.')
    } else {
      setDevOtp(result.otp)
      setStep('otp')
    }

    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await verifyOtp(phone, barbershop_id, otp)

    if (!result.success) {
      setError(result.error || 'Código inválido.')
    } else {
      router.push(`/${slug}/minha-conta`)
      router.refresh()
    }

    setLoading(false)
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleRequestOtp} className='space-y-4'>
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
          {loading ? 'Enviando...' : 'Enviar código'}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOtp} className='space-y-4'>
      <div className='text-center space-y-1'>
        <p className='text-sm text-zinc-400'>
          Código enviado para <span className='text-white font-medium'>{phone}</span>
        </p>
        {devOtp && (
          <p className='text-xs text-amber-500 bg-amber-500/10 rounded px-3 py-1'>
            [DEV] Código: <strong>{devOtp}</strong>
          </p>
        )}
      </div>

      <div>
        <label className='block text-sm font-medium text-zinc-300 mb-1'>
          Código de verificação
        </label>
        <Input
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder='000000'
          required
          maxLength={6}
          className='text-center text-2xl tracking-widest'
        />
      </div>

      {error && <p className='text-sm text-red-400 text-center'>{error}</p>}

      <Button type='submit' className='w-full' disabled={loading || otp.length !== 6}>
        {loading ? 'Verificando...' : 'Entrar'}
      </Button>

      <button
        type='button'
        onClick={() => { setStep('phone'); setOtp(''); setError('') }}
        className='w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors'
      >
        Usar outro número
      </button>
    </form>
  )
}
