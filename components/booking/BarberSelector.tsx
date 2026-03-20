'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Barber } from '@prisma/client'
import { Check } from 'lucide-react'
import { cn, formatPhone } from '@/lib/utils'

interface BarberSelectorProps {
  barbers: Barber[]
  selectedBarber: Barber | null
  onSelectBarber: (barber: Barber) => void
  onNext: () => void
  onBack?: () => void
}

export function BarberSelector({
  barbers,
  selectedBarber,
  onSelectBarber,
  onNext,
  onBack,
}: BarberSelectorProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  const availableBarbers = barbers.filter((b) => b.is_active)

  return (
    <div className='flex flex-col items-center space-y-6'>
      <div className='space-y-3 text-center'>
        <h3 className='text-lg font-semibold'>Escolha o Profissional</h3>
        <p className='text-sm text-zinc-400'>
          Selecione qual barbeiro deseja atender você
        </p>
      </div>

      <div className='w-full grid gap-4 sm:grid-cols-2'>
        {availableBarbers.map((barber) => (
          <Card
            key={barber.id}
            className={cn(
              'cursor-pointer border-2 transition-all hover:bg-zinc-800/50',
              selectedBarber?.id === barber.id
                ? 'border-amber-600 bg-amber-600/5'
                : 'border-zinc-700 bg-zinc-900/50',
            )}
            onClick={() => onSelectBarber(barber)}
          >
            <CardContent className='p-4 space-y-3'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1'>
                  {/* Avatar */}
                  <div className='mb-3'>
                    {barber.avatar_url ? (
                      <img
                        src={barber.avatar_url}
                        alt={barber.name}
                        className='h-12 w-12 rounded-full object-cover bg-zinc-700'
                      />
                    ) : (
                      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700'>
                        <span className='text-sm font-semibold text-black'>
                          {getInitials(barber.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <h4 className='font-semibold text-white'>{barber.name}</h4>
                  <p className='text-sm text-zinc-400'>
                    {formatPhone(barber.phone)}
                  </p>
                </div>
                {selectedBarber?.id === barber.id && (
                  <div className='rounded-full bg-amber-600 p-2 flex-shrink-0'>
                    <Check className='h-4 w-4 text-black' />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='w-full flex gap-3 pt-4'>
        {onBack && (
          <Button onClick={onBack} variant='outline' className='flex-1'>
            Voltar
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={!selectedBarber}
          className='flex-1'
          size='lg'
        >
          Continuar para Serviço
        </Button>
      </div>
    </div>
  )
}
