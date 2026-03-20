'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function TimeInput({
  value,
  onChange,
  label,
  className,
}: TimeInputProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Generate time slots (every 15 minutes)
  const generateTimeSlots = () => {
    const slots: string[] = []
    for (let i = 0; i < 24 * 4; i++) {
      const hours = Math.floor(i / 4)
      const minutes = (i % 4) * 15
      const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      slots.push(timeString)
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  return (
    <div className='space-y-0.5'>
      {label && <label className='text-xs text-zinc-500 block'>{label}</label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            className={cn(
              'justify-start text-left font-normal h-9 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-2',
              className,
            )}
          >
            <Clock className='mr-2 h-4 w-4 flex-shrink-0' />
            <span className='text-sm'>{value || '00:00'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-48 p-0 border-zinc-700 bg-zinc-900'>
          <div className='max-h-[200px] overflow-y-auto p-2 space-y-1'>
            {timeSlots.map((time) => (
              <button
                key={time}
                type='button'
                onClick={() => {
                  onChange(time)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                  value === time
                    ? 'bg-amber-600 text-black font-medium'
                    : 'text-zinc-200 hover:bg-zinc-800',
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
