"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateBR } from "@/lib/utils";
import { Barber, Service } from "@prisma/client";
import { Calendar, Clock } from "lucide-react";

interface DateTimeSelectorProps {
  barber: Barber | null;
  service: Service | null;
  selectedDateTime: Date | null;
  onSelectDateTime: (date: Date) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DateTimeSelector({
  barber,
  service,
  selectedDateTime,
  onSelectDateTime,
  onNext,
  onBack,
}: DateTimeSelectorProps) {
  const [availableTimes, setAvailableTimes] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!barber || !service) return;

    const fetchAvailableTimes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/available-times?barber_id=${barber.id}&date=${selectedDate}&service_duration=${service.duration_minutes}`
        );
        const data = await response.json();

        if (data.success) {
          setAvailableTimes(
            data.available_times.map((time: string) => new Date(time))
          );
        }
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableTimes();
  }, [barber, service, selectedDate]);

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Escolha a Data e Hora</h3>
        <p className="text-sm text-zinc-400">
          Selecione o melhor horário para você
        </p>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <label htmlFor="date" className="block text-sm font-medium">
          Data
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            className="pl-10"
          />
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">Horários Disponíveis</label>
        {isLoading ? (
          <p className="text-sm text-zinc-400">Carregando horários...</p>
        ) : availableTimes.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {availableTimes.map((time) => {
              const timeString = time.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const isSelected =
                selectedDateTime?.getTime() === time.getTime();

              return (
                <button
                  key={time.getTime()}
                  onClick={() => onSelectDateTime(time)}
                  className={cn(
                    "flex items-center justify-center rounded-lg border-2 py-2 px-3 transition-all",
                    isSelected
                      ? "border-amber-600 bg-amber-600/10 text-amber-600"
                      : "border-zinc-700 bg-zinc-900/50 text-white hover:border-amber-600/50"
                  )}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {timeString}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-red-500">
            Nenhum horário disponível para esta data
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedDateTime}
          className="flex-1"
          size="lg"
        >
          Continuar para Confirmação
        </Button>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
