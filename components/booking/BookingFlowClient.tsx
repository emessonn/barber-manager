"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { BarberSelector } from "@/components/booking/BarberSelector";
import { DateTimeSelector } from "@/components/booking/DateTimeSelector";
import { ConfirmationStep } from "@/components/booking/ConfirmationStep";
import { Service, Barber } from "@prisma/client";
import { Calendar, User, Clock, CheckCircle } from "lucide-react";

interface BookingFlowProps {
  barbershop_id: string;
  services: Service[];
  barbers: Barber[];
}

export function BookingFlow({
  barbershop_id,
  services,
  barbers,
}: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  const steps = [
    { id: 1, title: "Serviço", icon: <Calendar className="h-5 w-5" /> },
    { id: 2, title: "Profissional", icon: <User className="h-5 w-5" /> },
    { id: 3, title: "Data e Hora", icon: <Clock className="h-5 w-5" /> },
    { id: 4, title: "Confirmação", icon: <CheckCircle className="h-5 w-5" /> },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepChange = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = () => {
    // Booking criado com sucesso
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDateTime(null);
  };

  return (
    <div className="space-y-8">
      <BookingStepper
        currentStep={currentStep}
        steps={steps}
        onStepChange={handleStepChange}
      />

      <Card className="border-zinc-700 bg-zinc-900/50 backdrop-blur">
        <CardContent className="p-8">
          {currentStep === 1 && (
            <ServiceSelector
              services={services}
              selectedService={selectedService}
              onSelectService={setSelectedService}
              onNext={handleNext}
            />
          )}

          {currentStep === 2 && (
            <BarberSelector
              barbers={barbers}
              selectedBarber={selectedBarber}
              onSelectBarber={setSelectedBarber}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <DateTimeSelector
              barber={selectedBarber}
              service={selectedService}
              selectedDateTime={selectedDateTime}
              onSelectDateTime={setSelectedDateTime}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <ConfirmationStep
              barbershop_id={barbershop_id}
              barber={selectedBarber}
              service={selectedService}
              dateTime={selectedDateTime}
              onSubmit={handleSubmit}
              onBack={handleBack}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
