"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateBR, formatCurrency } from "@/lib/utils";
import { Barber, Service } from "@prisma/client";
import { createBooking } from "@/actions/bookings";
import { signIn } from "next-auth/react";

interface ConfirmationStepProps {
  barbershop_id: string;
  barber: Barber | null;
  service: Service | null;
  dateTime: Date | null;
  onSubmit: (data: any) => Promise<void>;
  onBack: () => void;
}

export function ConfirmationStep({
  barbershop_id,
  barber,
  service,
  dateTime,
  onSubmit,
  onBack,
}: ConfirmationStepProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barber || !service || !dateTime) return;

    setIsSubmitting(true);
    try {
      await createBooking(barbershop_id, {
        barber_id: barber.id,
        service_id: service.id,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        date_time: dateTime.toISOString(),
      });

      // Opcional: Trigger login
      await signIn("google", { redirectTo: "/" });

      await onSubmit({
        clientName,
        clientEmail,
        clientPhone,
      });
    } catch (error) {
      console.error("Erro ao criar booking:", error);
      alert("Erro ao criar agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Confirme seu Agendamento</h3>
        <p className="text-sm text-zinc-400">
          Revise seus dados e confirme o agendamento
        </p>
      </div>

      {/* Summary */}
      <Card className="border-zinc-700 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-zinc-400">Serviço</p>
              <p className="font-semibold">{service?.name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Profissional</p>
              <p className="font-semibold">{barber?.name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Data e Hora</p>
              <p className="font-semibold">
                {dateTime ? formatDateBR(dateTime) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Preço</p>
              <p className="font-semibold text-amber-600">
                {formatCurrency(service?.price || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nome Completo *
          </label>
          <Input
            id="name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="João Silva"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="joao@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Telefone *
          </label>
          <Input
            id="phone"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="(11) 98765-4321"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          Voltar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !clientName || !clientPhone}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? "Processando..." : "Confirmar Agendamento"}
        </Button>
      </div>

      <p className="text-center text-xs text-zinc-500">
        Ao confirmar, você receberá um SMS de confirmação
      </p>
    </form>
  );
}
