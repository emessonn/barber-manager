'use client'

import * as React from 'react'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DateTimePickerProps {
  date?: Date
  onDateChange: (date: Date) => void
  minDate?: Date
  label?: string
}

export function DateTimePicker({
  date,
  onDateChange,
  minDate,
  label = 'Data',
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800/70',
            !date && 'text-zinc-500',
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? (
            format(date, 'dd/MM/yyyy', { locale: ptBR })
          ) : (
            <span>{label}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0 border-zinc-700 bg-zinc-900'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={(newDate) => {
            if (newDate) {
              onDateChange(newDate)
              setIsOpen(false)
            }
          }}
          disabled={(date) => (minDate ? date < minDate : false)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface TimePickerProps {
  time?: Date
  onTimeChange: (date: Date) => void
  times: Date[]
  label?: string
}

export function TimePicker({
  time,
  onTimeChange,
  times,
  label = 'Horário',
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800/70',
            !time && 'text-zinc-500',
          )}
        >
          <Clock className='mr-2 h-4 w-4' />
          {time ? (
            time.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          ) : (
            <span>{label}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-4 border-zinc-700 bg-zinc-900'>
        <div className='space-y-2'>
          <p className='text-sm font-medium text-zinc-400'>
            Selecione um horário
          </p>
          <div className='grid gap-2 max-h-[200px] overflow-y-auto'>
            {times.map((t) => {
              const timeString = t.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })
              const isSelected = time?.getTime() === t.getTime()

              return (
                <Button
                  key={t.getTime()}
                  onClick={() => {
                    onTimeChange(t)
                    setIsOpen(false)
                  }}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'justify-start border-zinc-700',
                    isSelected &&
                      'border-amber-600 bg-amber-600 text-black hover:bg-amber-500',
                  )}
                >
                  {timeString}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
