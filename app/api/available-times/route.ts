import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const barber_id = searchParams.get("barber_id");
  const date = searchParams.get("date");
  const service_duration = searchParams.get("service_duration");

  if (!barber_id || !date || !service_duration) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  try {
    const barber = await prismaClient.barber.findUnique({
      where: { id: barber_id },
    });

    if (!barber) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado" },
        { status: 404 }
      );
    }

    const requestDate = new Date(date);
    const dayOfWeek = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
    })
      .format(requestDate)
      .toLowerCase();

    const workingHours = (barber.working_hours as Record<string, any>)[dayOfWeek] || null;

    if (!workingHours || !workingHours.start || !workingHours.end) {
      return NextResponse.json({ success: true, available_times: [] });
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
    const availableTimes: string[] = [];
    const duration = parseInt(service_duration);
    const [startHour, startMin] = workingHours.start.split(":").map(Number);
    const [endHour, endMin] = workingHours.end.split(":").map(Number);

    let currentTime = new Date(requestDate);
    currentTime.setHours(startHour, startMin, 0, 0);
    const endTime = new Date(requestDate);
    endTime.setHours(endHour, endMin, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);

      // Verificar se existe booking conflitante
      const hasConflict = bookings.some((booking) => {
        const bookingEnd = new Date(booking.date_time.getTime() + 30 * 60000);
        return currentTime < bookingEnd && slotEnd > booking.date_time;
      });

      if (!hasConflict && slotEnd <= endTime) {
        availableTimes.push(currentTime.toISOString());
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }

    return NextResponse.json({ success: true, available_times: availableTimes });
  } catch (error) {
    console.error("Erro ao buscar horários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários" },
      { status: 500 }
    );
  }
}
