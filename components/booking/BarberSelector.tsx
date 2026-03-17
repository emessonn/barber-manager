"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Barber } from "@prisma/client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarberSelectorProps {
  barbers: Barber[];
  selectedBarber: Barber | null;
  onSelectBarber: (barber: Barber) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BarberSelector({
  barbers,
  selectedBarber,
  onSelectBarber,
  onNext,
  onBack,
}: BarberSelectorProps) {
  const availableBarbers = barbers.filter((b) => b.is_active);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Escolha o Profissional</h3>
        <p className="text-sm text-zinc-400">
          Selecione qual barbeiro deseja atender você
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {availableBarbers.map((barber) => (
          <Card
            key={barber.id}
            className={cn(
              "cursor-pointer border-2 transition-all hover:bg-zinc-800/50",
              selectedBarber?.id === barber.id
                ? "border-amber-600 bg-amber-600/5"
                : "border-zinc-700 bg-zinc-900/50"
            )}
            onClick={() => onSelectBarber(barber)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white">{barber.name}</h4>
                  <p className="text-sm text-zinc-400">{barber.phone}</p>
                </div>
                {selectedBarber?.id === barber.id && (
                  <div className="rounded-full bg-amber-600 p-2">
                    <Check className="h-4 w-4 text-black" />
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Comissão: {barber.commission_percentage}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedBarber}
          className="flex-1"
          size="lg"
        >
          Continuar para Data
        </Button>
      </div>
    </div>
  );
}
