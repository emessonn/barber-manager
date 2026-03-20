'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface Step {
  id: number | string
  label: string
  icon?: React.ReactNode
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[]
  currentStep: number | string
  orientation?: 'vertical' | 'horizontal'
  onStepClick?: (stepId: number | string) => void
  completedSteps?: (number | string)[]
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      steps,
      currentStep,
      orientation = 'horizontal',
      onStepClick,
      completedSteps = [],
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full',
          orientation === 'vertical'
            ? 'flex-col'
            : 'flex-row items-start justify-center',
          className,
        )}
        {...props}
      >
        {steps.map((step, index) => {
          const isActive = currentStep === step.id
          const isCompleted = completedSteps.includes(step.id)
          const isIndex = typeof currentStep === 'number' && currentStep > index

          return (
            <div
              key={step.id}
              className={cn(
                'flex flex-col items-center',
                orientation === 'horizontal' ? 'flex-1' : 'w-full',
              )}
            >
              {/* Step circle and content */}
              <div className='flex flex-col items-center'>
                <button
                  onClick={() => onStepClick?.(step.id)}
                  disabled={!isCompleted && !isActive && !isIndex}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 mb-2 flex-shrink-0',
                    isActive
                      ? 'border-amber-600 bg-amber-600/10 text-amber-600'
                      : isCompleted || isIndex
                        ? 'border-amber-600 bg-amber-600 text-black'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400',
                  )}
                >
                  {step.icon || (
                    <span className='text-sm font-semibold'>{index + 1}</span>
                  )}
                </button>
                <p className='mt-2 text-center text-sm font-medium text-zinc-400'>
                  {step.label}
                </p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'transition-colors',
                    orientation === 'horizontal'
                      ? 'mt-0 h-1 w-full mx-2'
                      : 'mt-2 h-12 w-1',
                    isCompleted || isIndex ? 'bg-amber-600' : 'bg-zinc-700',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  },
)

Stepper.displayName = 'Stepper'

export { Stepper, type StepperProps, type Step }
