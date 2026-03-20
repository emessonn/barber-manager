'use server'

import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { workingHoursSchema, type WorkingHours } from '@/lib/validators'

const DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

type BarberDayHours = { start: string | null; end: string | null; break_time?: number }

function shopToBarberHours(
  shopHours: WorkingHours,
  existingBarberHours?: Record<string, BarberDayHours>,
) {
  const result: Record<string, { start: string | null; end: string | null; break_time: number }> = {}
  for (const day of DAYS) {
    const shopDay = shopHours[day]
    const breakTime = existingBarberHours?.[day]?.break_time ?? 60
    if (!shopDay.open || !shopDay.start || !shopDay.end) {
      result[day] = { start: null, end: null, break_time: breakTime }
    } else {
      result[day] = { start: shopDay.start, end: shopDay.end, break_time: breakTime }
    }
  }
  return result
}

export async function updateBarbershopWorkingHours(
  barbershop_id: string,
  working_hours: unknown,
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Não autorizado' }

    const validated = workingHoursSchema.parse(working_hours)

    await prismaClient.barbershop.update({
      where: { id: barbershop_id },
      data: { working_hours: validated },
    })

    // Sync all active barbers to match shop hours, preserving each barber's break_time
    const barbers = await prismaClient.barber.findMany({
      where: { barbershop_id, is_active: true },
      select: { id: true, working_hours: true },
    })

    await Promise.all(
      barbers.map((barber) => {
        const existing = barber.working_hours as Record<string, BarberDayHours> | null
        const newHours = shopToBarberHours(validated, existing ?? undefined)
        return prismaClient.barber.update({
          where: { id: barber.id },
          data: { working_hours: newHours },
        })
      }),
    )

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function addBarbershopException(
  barbershop_id: string,
  date: string, // YYYY-MM-DD
  reason?: string,
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Não autorizado' }

    const [y, m, d] = date.split('-').map(Number)
    // Store at noon UTC to avoid timezone boundary issues when reading back
    const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))

    await prismaClient.barbershopException.create({
      data: { barbershop_id, date: utcDate, reason: reason || null },
    })

    return { success: true }
  } catch (error: any) {
    if (error?.code === 'P2002') return { success: false, error: 'Esta data já está bloqueada' }
    return { success: false, error: String(error) }
  }
}

export async function removeBarbershopException(exception_id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Não autorizado' }

    await prismaClient.barbershopException.delete({ where: { id: exception_id } })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function updateBarbershopInfo(
  barbershop_id: string,
  data: {
    name: string
    phone: string
    address: string
    comission_rate: number
    logo_url?: string
  },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Não autorizado' }

    await prismaClient.barbershop.update({
      where: { id: barbershop_id },
      data,
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
