'use server'

import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { createBarberSchema } from '@/lib/validators'

const DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

export async function createBarber(
  barbershop_id: string,
  data: unknown,
  service_ids: string[] = [],
) {
  try {
    const validated = createBarberSchema.parse(data)

    // Use the barbershop's configured hours as starting defaults
    const barbershop = await prismaClient.barbershop.findUnique({
      where: { id: barbershop_id },
      select: { working_hours: true },
    })

    let barberHours: Record<string, { start: string | null; end: string | null; break_time: number }> | undefined
    const shopHours = barbershop?.working_hours as Record<string, { open: boolean; start: string | null; end: string | null }> | null
    if (shopHours) {
      barberHours = {}
      for (const day of DAYS) {
        const shopDay = shopHours[day]
        if (!shopDay?.open || !shopDay.start || !shopDay.end) {
          barberHours[day] = { start: null, end: null, break_time: 60 }
        } else {
          barberHours[day] = { start: shopDay.start, end: shopDay.end, break_time: 60 }
        }
      }
    }

    const barber = await prismaClient.barber.create({
      data: {
        ...validated,
        barbershop_id,
        ...(barberHours ? { working_hours: barberHours } : {}),
        services:
          service_ids.length > 0
            ? { connect: service_ids.map((id) => ({ id })) }
            : undefined,
      },
      include: { services: true },
    })

    return { success: true, barber }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function updateBarber(
  barber_id: string,
  data: unknown,
  service_ids: string[] = [],
) {
  try {
    const session = await auth()
    const validated = createBarberSchema.parse(data)

    // Recepção não pode alterar comissão
    const updateData: typeof validated = { ...validated }
    if (session?.user?.role === 'RECEPCAO') {
      const current = await prismaClient.barber.findUnique({
        where: { id: barber_id },
        select: { commission_percentage: true },
      })
      if (current) {
        updateData.commission_percentage = current.commission_percentage
      }
    }

    const barber = await prismaClient.barber.update({
      where: { id: barber_id },
      data: {
        ...updateData,
        services: { set: service_ids.map((id) => ({ id })) },
      },
      include: { services: true },
    })

    return { success: true, barber }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function deleteBarber(barber_id: string) {
  try {
    await prismaClient.barber.delete({
      where: { id: barber_id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function toggleBarberActive(
  barber_id: string,
  is_active: boolean,
) {
  try {
    const barber = await prismaClient.barber.update({
      where: { id: barber_id },
      data: { is_active },
    })

    return { success: true, barber }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
