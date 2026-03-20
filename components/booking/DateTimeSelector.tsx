'use client'

import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Barber, Service } from '@prisma/client'
import { Clock, Calendar as CalendarIcon, CalendarX } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DateTimeSelectorProps {
  barber: Barber | null
  services: Service[]
  selectedDateTime: Date | null
  onSelectDateTime: (date: Date) => void
  onNext: () => void
  onBack: () => void
}

export function DateTimeSelector({
  barber,
  services,
  selectedDateTime,
  onSelectDateTime,
  onNext,
  onBack,
}: DateTimeSelectorProps) {
  const totalDuration = services.reduce((acc, s) => acc + s.duration_minutes, 0)
  const [availableTimes, setAvailableTimes] = useState<Date[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [exception, setException] = useState<{ reason: string | null } | null>(null)

  useEffect(() => {
    if (!barber || services.length === 0 || !selectedDate) return

    const fetchAvailableTimes = async () => {
      setIsLoading(true)
      setException(null)
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd')
        const response = await fetch(
          `/api/available-times?barber_id=${barber.id}&date=${dateString}&service_duration=${totalDuration}`,
        )
        const data = await response.json()

        if (data.success) {
          setAvailableTimes(
            data.available_times.map((time: string) => new Date(time)),
          )
          setException(data.exception ?? null)
        }
      } catch (error) {
        console.error('Erro ao buscar horários:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableTimes()
  }, [barber, services, selectedDate, totalDuration])

  const minDate = new Date()

  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date)
    setException(null)
    onSelectDateTime(null as unknown as Date)
  }

  return (
    <div className='flex flex-col space-y-6'>
      <div className='space-y-1 text-center'>
        <h3 className='text-lg font-semibold'>Escolha a Data e Hora</h3>
        <p className='text-sm text-zinc-400'>
          Selecione o melhor horário para você
        </p>
      </div>

      <div className='flex flex-col gap-6'>

        {/* Date Picker Popover */}
        <div className='space-y-2'>
          <p className='text-sm font-medium text-zinc-300'>Data</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !selectedDate && 'text-zinc-500',
                )}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {selectedDate
                  ? format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : 'Selecione uma data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto border-zinc-700 bg-zinc-900 p-0' align='start'>
              <Calendar
                mode='single'
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < minDate}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Horários */}
        <div className='flex flex-col gap-3'>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-zinc-400' />
            <p className='text-sm font-medium text-zinc-300'>
              Horários Disponíveis
            </p>
          </div>

          {isLoading ? (
            <div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className='h-10 animate-pulse rounded-lg bg-zinc-800'
                />
              ))}
            </div>
          ) : availableTimes.length > 0 ? (
            <div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
              {availableTimes.map((time) => {
                const timeString = time.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const isSelected =
                  selectedDateTime?.getTime() === time.getTime()

                return (
                  <button
                    key={time.getTime()}
                    onClick={() => onSelectDateTime(time)}
                    className={cn(
                      'rounded-lg border-2 py-2 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-amber-500 bg-amber-600/20 text-amber-400'
                        : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-amber-600/50 hover:bg-zinc-800',
                    )}
                  >
                    {timeString}
                  </button>
                )
              })}
            </div>
          ) : exception ? (
            <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-10 text-center'>
              <CalendarX className='h-8 w-8 text-red-400' />
              <p className='text-sm font-medium text-red-400'>
                Barbearia fechada neste dia
              </p>
              {exception.reason && (
                <p className='text-xs text-red-400/70'>{exception.reason}</p>
              )}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/30 py-10 text-center'>
              <Clock className='h-8 w-8 text-zinc-600' />
              <p className='text-sm text-zinc-500'>
                Nenhum horário disponível para esta data
              </p>
            </div>
          )}

          {selectedDateTime && (
            <p className='text-xs text-amber-400'>
              Horário selecionado:{' '}
              <span className='font-semibold'>
                {selectedDateTime.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className='flex gap-3 pt-2'>
        <Button onClick={onBack} variant='outline' className='flex-1'>
          Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedDateTime}
          className='flex-1'
          size='lg'
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
