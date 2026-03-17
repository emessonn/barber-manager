"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Service } from "@prisma/client";
import { Check } from "lucide-react";

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
  onNext: () => void;
}

export function ServiceSelector({
  services,
  selectedService,
  onSelectService,
  onNext,
}: ServiceSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Escolha o Serviço</h3>
        <p className="text-sm text-zinc-400">
          Selecione o serviço desejado para sua barbearia
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <Card
            key={service.id}
            className={cn(
              "cursor-pointer border-2 transition-all hover:bg-zinc-800/50",
              selectedService?.id === service.id
                ? "border-amber-600 bg-amber-600/5"
                : "border-zinc-700 bg-zinc-900/50"
            )}
            onClick={() => onSelectService(service)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{service.name}</h4>
                  <p className="text-sm text-zinc-400">
                    {service.duration_minutes} minutos
                  </p>
                </div>
                {selectedService?.id === service.id && (
                  <div className="rounded-full bg-amber-600 p-2">
                    <Check className="h-4 w-4 text-black" />
                  </div>
                )}
              </div>

              {service.description && (
                <p className="text-xs text-zinc-500">{service.description}</p>
              )}

              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(service.price)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={onNext}
        disabled={!selectedService}
        className="w-full"
        size="lg"
      >
        Continuar para Profissional
      </Button>
    </div>
  );
}

import { cn } from "@/lib/utils";
