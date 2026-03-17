import { prismaClient } from "@/lib/prisma";
import { BookingFlow } from "@/components/booking/BookingFlowClient";
import { notFound } from "next/navigation";
import { Scissors } from "lucide-react";

export default async function BookingPage({
  params,
}: {
  params: { slug: string };
}) {
  const barbershop = await prismaClient.barbershop.findUnique({
    where: { slug: params.slug },
  });

  if (!barbershop) {
    notFound();
  }

  const [services, barbers] = await Promise.all([
    prismaClient.service.findMany({
      where: {
        barbershop_id: barbershop.id,
        is_active: true,
      },
    }),
    prismaClient.barber.findMany({
      where: {
        barbershop_id: barbershop.id,
        is_active: true,
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 py-8 px-4">
      <div className="container mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-lg bg-amber-600/10 p-4">
              <Scissors className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">{barbershop.name}</h1>
          <p className="text-zinc-400">{barbershop.address}</p>
          <p className="text-sm text-zinc-500">{barbershop.phone}</p>
        </div>

        {/* Booking Flow */}
        {services.length > 0 && barbers.length > 0 ? (
          <BookingFlow
            barbershop_id={barbershop.id}
            services={services}
            barbers={barbers}
          />
        ) : (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-400">
              Esta barbearia não possui serviços ou profissionais cadastrados no
              momento.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
