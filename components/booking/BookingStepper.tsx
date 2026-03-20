'use client'

import { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingStep {
  id: string
  title: string
  icon: ReactNode
}

interface BookingStepperProps {
  steps: BookingStep[]
  currentId: string
  currentIndex: number
  onGoTo: (id: string) => void
}

export function BookingStepper({
  steps,
  currentId,
  currentIndex,
  onGoTo,
}: BookingStepperProps) {
  return (
    <div className='flex w-full items-start'>
      {steps.map((step, index) => {
        const isActive = step.id === currentId
        const isCompleted = index < currentIndex
        const isClickable = isCompleted

        return (
          <div
            key={step.id}
            className={cn(
              'flex flex-1 flex-col',
              index === 0
                ? 'items-start'
                : index === steps.length - 1
                  ? 'items-end'
                  : 'items-center',
            )}
          >
            {/* Circle + horizontal connectors */}
            <div className='flex w-full items-center'>
              {/* Left connector */}
              {index > 0 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-colors duration-300',
                    index <= currentIndex ? 'bg-amber-600' : 'bg-zinc-700',
                  )}
                />
              )}

              {/* Step circle */}
              <button
                type='button'
                onClick={() => isClickable && onGoTo(step.id)}
                disabled={!isClickable}
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                  'disabled:cursor-not-allowed',
                  isActive
                    ? 'border-amber-600 bg-amber-600/10 text-amber-600 ring-2 ring-amber-600/30'
                    : isCompleted
                      ? 'border-amber-600 bg-amber-600 text-black'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-500',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? <Check className='h-4 w-4' /> : step.icon}
              </button>

              {/* Right connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-colors duration-300',
                    index < currentIndex ? 'bg-amber-600' : 'bg-zinc-700',
                  )}
                />
              )}
            </div>

            {/* Label */}
            <p
              className={cn(
                'mt-2 px-1 text-xs transition-colors duration-300',
                index === 0
                  ? 'text-start'
                  : index === steps.length - 1
                    ? 'text-end'
                    : 'text-center',
                isActive
                  ? 'font-semibold text-amber-600'
                  : isCompleted
                    ? 'text-zinc-300'
                    : 'text-zinc-500',
              )}
            >
              {step.title}
            </p>
          </div>
        )
      })}
    </div>
  )
}
