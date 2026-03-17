"use server";

import { prismaClient } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validators";

export async function createBooking(
  barbershop_id: string,
  data: unknown
) {
  try {
    const validated = createBookingSchema.parse(data);

    // Validar se horário já está ocupado
    const existingBooking = await prismaClient.booking.findUnique({
      where: {
        barber_id_date_time: {
          barber_id: validated.barber_id,
          date_time: new Date(validated.date_time),
        },
      },
    });

    if (existingBooking) {
      return {
        success: false,
        error: "Horário já está ocupado para este barbeiro",
      };
    }

    // Buscar ou criar cliente
    let client = await prismaClient.client.findUnique({
      where: {
        phone_barbershop_id: {
          phone: validated.client_phone,
          barbershop_id,
        },
      },
    });

    if (!client) {
      client = await prismaClient.client.create({
        data: {
          name: validated.client_name,
          phone: validated.client_phone,
          email: validated.client_email || null,
          barbershop_id,
        },
      });
    }

    // Buscar serviço para obter o preço
    const service = await prismaClient.service.findUnique({
      where: { id: validated.service_id },
    });

    if (!service) {
      return { success: false, error: "Serviço não encontrado" };
    }

    // Criar booking
    const booking = await prismaClient.booking.create({
      data: {
        barber_id: validated.barber_id,
        service_id: validated.service_id,
        client_id: client.id,
        date_time: new Date(validated.date_time),
        notes: validated.notes,
        total_price: service.price,
        status: "CONFIRMADO",
      },
      include: {
        barber: true,
        service: true,
        client: true,
      },
    });

    // Criar registro financeiro automático
    await prismaClient.financialRecord.create({
      data: {
        barbershop_id,
        type: "ENTRADA",
        amount: service.price,
        description: `Serviço: ${service.name} - Cliente: ${client.name}`,
        category: "SERVIÇO",
        booking_id: booking.id,
      },
    });

    // Calcular e registrar comissão
    const commission_amount = (service.price * service.commission_percentage || 20) / 100;
    await prismaClient.commission.create({
      data: {
        barber_id: validated.barber_id,
        service_id: validated.service_id,
        booking_id: booking.id,
        amount: commission_amount,
        percentage: service.commission_percentage || 20,
        barbershop_id,
      },
    });

    return { success: true, booking };
  } catch (error) {
    console.error("Erro ao criar booking:", error);
    return { success: false, error: String(error) };
  }
}

export async function getAvailableTimes(
  barber_id: string,
  date: string,
  service_duration: number
) {
  try {
    const barber = await prismaClient.barber.findUnique({
      where: { id: barber_id },
    });

    if (!barber) {
      return { success: false, error: "Barbeiro não encontrado" };
    }

    const requestDate = new Date(date);
    const dayOfWeek = requestDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const workingHours = barber.working_hours[dayOfWeek as keyof typeof barber.working_hours];

    if (!workingHours || !workingHours.start || !workingHours.end) {
      return { success: true, available_times: [] };
    }

    // Buscar bookings do dia
    const dayStart = new Date(requestDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bookings = await prismaClient.booking.findMany({
      where: {
        barber_id,
        date_time: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: { in: ["CONFIRMADO", "FINALIZADO"] },
      },
    });

    // Gerar slots de tempo disponíveis
    const availableTimes: Date[] = [];
    const [startHour, startMin] = workingHours.start.split(":").map(Number);
    const [endHour, endMin] = workingHours.end.split(":").map(Number);

    let currentTime = new Date(requestDate);
    currentTime.setHours(startHour, startMin, 0, 0);
    const endTime = new Date(requestDate);
    endTime.setHours(endHour, endMin, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(
        currentTime.getTime() + service_duration * 60000
      );

      // Verificar se existe booking conflitante
      const hasConflict = bookings.some((booking) => {
        const bookingEnd = new Date(
          booking.date_time.getTime() + 30 * 60000
        ); // Assumir 30 min padrão
        return (
          currentTime < bookingEnd &&
          slotEnd > booking.date_time
        );
      });

      if (!hasConflict && slotEnd <= endTime) {
        availableTimes.push(new Date(currentTime));
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000); // Incrementar 30 min
    }

    return { success: true, available_times: availableTimes };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
