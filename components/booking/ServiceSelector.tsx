'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Service } from '@prisma/client'
import { Check } from 'lucide-react'

interface ServiceSelectorProps {
  services: Service[]
  selectedServices: Service[]
  onToggleService: (service: Service) => void
  onNext: () => void
  onBack?: () => void
}

export function ServiceSelector({
  services,
  selectedServices,
  onToggleService,
  onNext,
  onBack,
}: ServiceSelectorProps) {
  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)
  const totalMinutes = selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0)

  function formatDuration(min: number) {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
  }

  return (
    <div className='flex flex-col items-center space-y-6'>
      <div className='space-y-3 text-center'>
        <h3 className='text-lg font-semibold'>Escolha os Serviços</h3>
        <p className='text-sm text-zinc-400'>
          Selecione um ou mais serviços desejados
        </p>
      </div>

      <div className='w-full grid gap-4 sm:grid-cols-2'>
        {services.map((service) => {
          const isSelected = selectedServices.some((s) => s.id === service.id)
          return (
            <div
              key={service.id}
              role='checkbox'
              aria-checked={isSelected}
              onClick={() => onToggleService(service)}
              className={cn(
                'cursor-pointer rounded-xl border-2 p-4 space-y-3 transition-all hover:bg-zinc-800/50 select-none',
                isSelected
                  ? 'border-amber-600 bg-amber-600/5'
                  : 'border-zinc-700 bg-zinc-900/50',
              )}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1'>
                  <div className='mb-3'>
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className='h-12 w-12 rounded-lg object-cover bg-zinc-700'
                      />
                    ) : (
                      <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-amber-700'>
                        <span className='text-sm font-semibold text-black'>
                          {getInitials(service.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <h4 className='font-semibold text-white'>{service.name}</h4>
                  <p className='text-sm text-zinc-400'>{service.duration_minutes} minutos</p>
                </div>
                <div
                  className={cn(
                    'rounded-full p-2 flex-shrink-0 border-2 transition-all',
                    isSelected
                      ? 'border-amber-600 bg-amber-600'
                      : 'border-zinc-600 bg-transparent',
                  )}
                >
                  <Check className={cn('h-4 w-4', isSelected ? 'text-black' : 'text-transparent')} />
                </div>
              </div>

              {service.description && (
                <p className='text-xs text-zinc-500'>{service.description}</p>
              )}

              <p className='text-lg font-bold text-amber-600'>
                {formatCurrency(service.price)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {selectedServices.length > 0 && (
        <div className='w-full rounded-xl border border-amber-600/30 bg-amber-600/5 px-4 py-3 flex items-center justify-between text-sm'>
          <span className='text-zinc-400'>
            {selectedServices.length} serviço{selectedServices.length > 1 ? 's' : ''} · {formatDuration(totalMinutes)}
          </span>
          <span className='font-bold text-amber-500'>{formatCurrency(totalPrice)}</span>
        </div>
      )}

      <div className='w-full flex gap-3 pt-2'>
        {onBack && (
          <Button onClick={onBack} variant='outline' className='flex-1'>
            Voltar
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={selectedServices.length === 0}
          className='flex-1'
          size='lg'
        >
          Continuar para Data
        </Button>
      </div>
    </div>
  )
}
