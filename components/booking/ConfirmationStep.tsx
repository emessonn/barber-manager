'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateBR, formatCurrency } from '@/lib/utils'
import { Barber, Service } from '@prisma/client'
import { createBooking } from '@/actions/bookings'
import { sendBookingConfirmationWhatsApp } from '@/actions/notifications'
import {
  CheckCircle,
  CalendarDays,
  CreditCard,
  Banknote,
  Loader2,
  QrCode,
} from 'lucide-react'
import { toast } from 'sonner'

interface ConfirmationStepProps {
  barbershop_id: string
  barbershop_slug: string
  barber: Barber | null
  services: Service[]
  dateTime: Date | null
  loggedInClient: { name: string; phone: string } | null
  onSubmit: (data: unknown) => Promise<void>
  onBack: () => void
}

export function ConfirmationStep({
  barbershop_id,
  barbershop_slug,
  barber,
  services,
  dateTime,
  loggedInClient,
  onSubmit,
  onBack,
}: ConfirmationStepProps) {
  const [clientName, setClientName] = useState(loggedInClient?.name ?? '')
  const [clientPhone, setClientPhone] = useState(loggedInClient?.phone ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPayingOnline, setIsPayingOnline] = useState(false)
  const [bookedIds, setBookedIds] = useState<string[]>([])

  const totalPrice = services.reduce((acc, s) => acc + s.price, 0)
  const totalMinutes = services.reduce((acc, s) => acc + s.duration_minutes, 0)

  function formatDuration(min: number) {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
  }

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      let formatted = cleaned
      if (cleaned.length > 2)
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
      if (cleaned.length > 7) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
      }
      setClientPhone(formatted)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!barber || services.length === 0 || !dateTime) return

    setIsSubmitting(true)
    const createdIds: string[] = []

    try {
      let cursor = dateTime.getTime()
      for (const service of services) {
        const result = await createBooking(barbershop_id, {
          barber_id: barber.id,
          service_id: service.id,
          client_name: clientName,
          client_phone: clientPhone,
          date_time: new Date(cursor).toISOString(),
        })

        if (!result.success) {
          toast.error(`Erro ao agendar "${service.name}": ${result.error}`)
          setIsSubmitting(false)
          return
        }

        createdIds.push(result?.booking?.id ?? '') 
        cursor += service.duration_minutes * 60_000
      }

      // Envia confirmação WhatsApp (fire-and-forget)
      await sendBookingConfirmationWhatsApp(
        createdIds[0],
        window.location.origin,
      )

      setBookedIds(createdIds)
      await onSubmit({ clientName, clientPhone })
    } catch (error) {
      console.error('Erro ao criar bookings:', error)
      toast.error('Erro ao criar agendamento. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePayOnline = async () => {
    if (!bookedIds.length) return
    setIsPayingOnline(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_ids: bookedIds,
          client_name: clientName,
          barbershop_slug,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Erro ao iniciar pagamento.')
        return
      }

      const { checkout_url } = await res.json()
      window.location.href = checkout_url
    } catch {
      toast.error('Erro ao conectar com o sistema de pagamento.')
    } finally {
      setIsPayingOnline(false)
    }
  }

  // ─── Tela de escolha de pagamento (após booking criado) ────────────────────
  if (bookedIds.length > 0) {
    return (
      <div className='flex flex-col items-center space-y-6 w-full max-w-sm mx-auto text-center'>
        {/* Sucesso */}
        <div className='flex flex-col items-center gap-3'>
          <div className='w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center'>
            <CheckCircle className='text-green-500 w-8 h-8' />
          </div>
          <h3 className='text-xl font-bold'>Agendamento confirmado!</h3>
          <p className='text-sm text-zinc-400'>
            {services.map((s) => s.name).join(' + ')} com {barber?.name} em{' '}
            {dateTime ? formatDateBR(dateTime) : ''}
          </p>
        </div>

        {/* Confirmação WhatsApp */}
        <p className='text-xs text-amber-500/80 flex items-center gap-1.5 justify-center'>
          <span>📱</span> Confirmação enviada por WhatsApp
        </p>

        {/* Escolha de pagamento */}
        <Card className='w-full border-zinc-700 bg-zinc-900/50'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-center text-zinc-400 font-normal'>
              Como deseja pagar?
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 pb-4'>
            {/* Total */}
            <div className='flex items-center justify-between rounded-lg bg-zinc-800/60 px-4 py-3'>
              <span className='text-sm text-zinc-400'>Total</span>
              <span className='text-lg font-bold text-amber-500'>
                {formatCurrency(totalPrice)}
              </span>
            </div>

            {/* Pagar online */}
            <Button
              onClick={handlePayOnline}
              disabled={isPayingOnline}
              className='w-full bg-blue-600 hover:bg-blue-500 flex items-center gap-2'
              size='lg'
            >
              {isPayingOnline ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <QrCode className='h-4 w-4' />
              )}
              {isPayingOnline ? 'Redirecionando...' : 'Pagar Online (PIX / Cartão)'}
            </Button>

            <div className='flex items-center gap-2 text-xs text-zinc-600'>
              <div className='flex-1 border-t border-zinc-800' />
              <span>ou</span>
              <div className='flex-1 border-t border-zinc-800' />
            </div>

            {/* Pagar na barbearia */}
            <a href={`/${barbershop_slug}/minha-conta`} className='block'>
              <Button
                variant='outline'
                className='w-full border-zinc-700 flex items-center gap-2'
                size='lg'
              >
                <Banknote className='h-4 w-4' />
                Pagar na Barbearia
              </Button>
            </a>
          </CardContent>
        </Card>

        <a
          href={`/${barbershop_slug}`}
          className='text-sm text-zinc-500 hover:text-zinc-300 transition-colors'
        >
          Fazer outro agendamento
        </a>
      </div>
    )
  }

  // ─── Formulário de confirmação ─────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className='flex flex-col items-center space-y-6 max-w-2xl'
    >
      <div className='space-y-3 text-center'>
        <h3 className='text-lg font-semibold'>Confirme seu Agendamento</h3>
        <p className='text-sm text-zinc-400'>
          Revise seus dados e confirme o agendamento
        </p>
      </div>

      {/* Resumo */}
      <Card className='w-full border-zinc-700 bg-zinc-900/50'>
        <CardHeader>
          <CardTitle className='text-base text-center'>Resumo</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            {services.map((service) => (
              <div
                key={service.id}
                className='flex items-center justify-between text-sm'
              >
                <div>
                  <span className='font-medium text-white'>{service.name}</span>
                  <span className='text-zinc-500 ml-2'>
                    ({service.duration_minutes}min)
                  </span>
                </div>
                <span className='text-amber-500'>
                  {formatCurrency(service.price)}
                </span>
              </div>
            ))}
            {services.length > 1 && (
              <div className='flex items-center justify-between border-t border-zinc-700 pt-2 text-sm font-semibold'>
                <span className='text-zinc-300'>
                  Total · {formatDuration(totalMinutes)}
                </span>
                <span className='text-amber-600'>
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            )}
          </div>

          <div className='grid gap-3 sm:grid-cols-2 border-t border-zinc-700 pt-4'>
            <div className='text-center'>
              <p className='text-sm text-zinc-400'>Profissional</p>
              <p className='font-semibold'>{barber?.name}</p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-zinc-400'>Data e Hora</p>
              <p className='font-semibold'>
                {dateTime ? formatDateBR(dateTime) : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do cliente */}
      <div className='w-full max-w-sm space-y-4'>
        {loggedInClient && (
          <p className='text-xs text-amber-500/80 text-center'>
            Dados preenchidos com sua conta
          </p>
        )}
        <div>
          <label htmlFor='name' className='block text-sm font-medium mb-1'>
            Nome Completo *
          </label>
          <Input
            id='name'
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder='João Silva'
            readOnly={!!loggedInClient}
            className={loggedInClient ? 'opacity-70 cursor-default' : ''}
            required
          />
        </div>

        <div>
          <label htmlFor='phone' className='block text-sm font-medium mb-1'>
            Telefone (WhatsApp) *
          </label>
          <Input
            id='phone'
            value={clientPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder='(XX) XXXXX-XXXX'
            readOnly={!!loggedInClient}
            className={loggedInClient ? 'opacity-70 cursor-default' : ''}
            required
          />
          <p className='mt-1 text-xs text-zinc-500'>
            Você receberá confirmação e lembretes neste número
          </p>
        </div>
      </div>

      <div className='w-full flex gap-3 pt-4'>
        <Button
          type='button'
          onClick={onBack}
          variant='outline'
          className='flex-1'
        >
          Voltar
        </Button>
        <Button
          type='submit'
          disabled={isSubmitting || !clientName || !clientPhone}
          className='flex-1'
          size='lg'
        >
          {isSubmitting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Processando...
            </>
          ) : (
            'Confirmar Agendamento'
          )}
        </Button>
      </div>

      <p className='text-center text-xs text-zinc-500 flex items-center gap-1.5 justify-center'>
        <span>📱</span> Confirmação enviada por WhatsApp
      </p>
    </form>
  )
}
