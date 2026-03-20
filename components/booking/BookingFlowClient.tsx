'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BookingStepper } from '@/components/booking/BookingStepper'
import { ServiceSelector } from '@/components/booking/ServiceSelector'
import { BarberSelector } from '@/components/booking/BarberSelector'
import { DateTimeSelector } from '@/components/booking/DateTimeSelector'
import { ConfirmationStep } from '@/components/booking/ConfirmationStep'
import { Service, Barber } from '@prisma/client'
import { Calendar, User, Clock, CheckCircle } from 'lucide-react'
import { defineStepper } from '@stepperize/react'

const { useStepper } = defineStepper(
  {
    id: 'professional' as const,
    title: 'Profissional',
    icon: <User className='h-5 w-5' />,
  },
  {
    id: 'service' as const,
    title: 'Serviço',
    icon: <Calendar className='h-5 w-5' />,
  },
  {
    id: 'datetime' as const,
    title: 'Data e Hora',
    icon: <Clock className='h-5 w-5' />,
  },
  {
    id: 'confirmation' as const,
    title: 'Confirmação',
    icon: <CheckCircle className='h-5 w-5' />,
  },
)

interface BookingFlowProps {
  barbershop_id: string
  barbershop_slug: string
  services: Service[]
  barbers: Barber[]
  loggedInClient: { name: string; phone: string } | null
}

export function BookingFlow({
  barbershop_id,
  barbershop_slug,
  services,
  barbers,
  loggedInClient,
}: BookingFlowProps) {
  const stepper = useStepper()

  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null)

  function handleToggleService(service: Service) {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service],
    )
  }

  async function handleSubmit() {
    // Booking confirmed — ConfirmationStep handles the success UI
  }

  return (
    <div className='flex flex-col items-center space-y-8'>
      <div className='w-full max-w-2xl px-2'>
        <BookingStepper
          steps={stepper.state.all}
          currentId={stepper.state.current.data.id}
          currentIndex={stepper.state.current.index}
          onGoTo={(id) =>
            stepper.navigation.goTo(
              id as Parameters<typeof stepper.navigation.goTo>[0],
            )
          }
        />
      </div>

      <Card className='w-full max-w-2xl border-zinc-700 bg-zinc-900/50 backdrop-blur'>
        <CardContent className='p-6 sm:p-8'>
          {stepper.flow.switch({
            professional: () => (
              <BarberSelector
                barbers={barbers}
                selectedBarber={selectedBarber}
                onSelectBarber={setSelectedBarber}
                onNext={() => stepper.navigation.next()}
              />
            ),
            service: () => (
              <ServiceSelector
                services={services}
                selectedServices={selectedServices}
                onToggleService={handleToggleService}
                onNext={() => stepper.navigation.next()}
                onBack={() => stepper.navigation.prev()}
              />
            ),
            datetime: () => (
              <DateTimeSelector
                barber={selectedBarber}
                services={selectedServices}
                selectedDateTime={selectedDateTime}
                onSelectDateTime={setSelectedDateTime}
                onNext={() => stepper.navigation.next()}
                onBack={() => stepper.navigation.prev()}
              />
            ),
            confirmation: () => (
              <ConfirmationStep
                barbershop_id={barbershop_id}
                barbershop_slug={barbershop_slug}
                barber={selectedBarber}
                services={selectedServices}
                dateTime={selectedDateTime}
                loggedInClient={loggedInClient}
                onSubmit={handleSubmit}
                onBack={() => stepper.navigation.prev()}
              />
            ),
          })}
        </CardContent>
      </Card>
    </div>
  )
}
