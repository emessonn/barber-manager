'use server'

import { prismaClient } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const createStaffUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  login: z
    .string()
    .min(3, 'Login deve ter pelo menos 3 caracteres')
    .regex(/^[a-z0-9._-]+$/, 'Login deve conter apenas letras minúsculas, números, pontos, hífens ou underscores'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['BARBER', 'RECEPCAO']),
  barber_id: z.string().optional(), // Link to Barber record for BARBER role
})

const updateStaffUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['BARBER', 'RECEPCAO']).optional(),
  barber_id: z.string().optional().nullable(),
})

async function getAdminBarbershopId() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, barbershop_id: true },
  })

  if (user?.role !== 'ADMIN' || !user.barbershop_id) return null
  return user.barbershop_id
}

export async function getStaffUsers() {
  const barbershopId = await getAdminBarbershopId()
  if (!barbershopId) return { success: false, error: 'Não autorizado' }

  const users = await prismaClient.user.findMany({
    where: {
      barbershop_id: barbershopId,
      role: { in: ['BARBER', 'RECEPCAO'] },
      login: { not: null },
    },
    select: {
      id: true,
      name: true,
      login: true,
      role: true,
      created_at: true,
      barber: {
        select: { id: true, name: true, avatar_url: true },
      },
    },
    orderBy: { created_at: 'asc' },
  })

  return { success: true, users }
}

export async function createStaffUser(data: unknown) {
  const barbershopId = await getAdminBarbershopId()
  if (!barbershopId) return { success: false, error: 'Não autorizado' }

  try {
    const validated = createStaffUserSchema.parse(data)

    // Check if login already exists in this barbershop
    const existing = await prismaClient.user.findFirst({
      where: { login: validated.login, barbershop_id: barbershopId },
    })
    if (existing) {
      return { success: false, error: 'Esse login já está em uso nessa barbearia' }
    }

    const password_hash = await bcrypt.hash(validated.password, 12)

    const user = await prismaClient.user.create({
      data: {
        name: validated.name,
        login: validated.login,
        password_hash,
        role: validated.role,
        barbershop_id: barbershopId,
      },
      select: { id: true, name: true, login: true, role: true },
    })

    // Link to barber record if provided
    if (validated.barber_id && validated.role === 'BARBER') {
      await prismaClient.barber.update({
        where: { id: validated.barber_id },
        data: { user_id: user.id },
      })
    }

    return { success: true, user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: String(error) }
  }
}

export async function updateStaffUser(userId: string, data: unknown) {
  const barbershopId = await getAdminBarbershopId()
  if (!barbershopId) return { success: false, error: 'Não autorizado' }

  try {
    const validated = updateStaffUserSchema.parse(data)

    // Ensure user belongs to this barbershop
    const existing = await prismaClient.user.findFirst({
      where: { id: userId, barbershop_id: barbershopId, login: { not: null } },
    })
    if (!existing) return { success: false, error: 'Usuário não encontrado' }

    const user = await prismaClient.user.update({
      where: { id: userId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.role && { role: validated.role }),
      },
      select: { id: true, name: true, login: true, role: true },
    })

    // Update barber link
    if (validated.role === 'BARBER' && validated.barber_id !== undefined) {
      // Unlink old barber first
      await prismaClient.barber.updateMany({
        where: { user_id: userId },
        data: { user_id: null },
      })
      // Link new barber if provided
      if (validated.barber_id) {
        await prismaClient.barber.update({
          where: { id: validated.barber_id },
          data: { user_id: userId },
        })
      }
    } else if (validated.role === 'RECEPCAO') {
      // Unlink barber when changing to RECEPCAO
      await prismaClient.barber.updateMany({
        where: { user_id: userId },
        data: { user_id: null },
      })
    }

    return { success: true, user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: String(error) }
  }
}

export async function resetStaffPassword(userId: string, newPassword: string) {
  const barbershopId = await getAdminBarbershopId()
  if (!barbershopId) return { success: false, error: 'Não autorizado' }

  if (newPassword.length < 6) {
    return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' }
  }

  const existing = await prismaClient.user.findFirst({
    where: { id: userId, barbershop_id: barbershopId, login: { not: null } },
  })
  if (!existing) return { success: false, error: 'Usuário não encontrado' }

  const password_hash = await bcrypt.hash(newPassword, 12)
  await prismaClient.user.update({
    where: { id: userId },
    data: { password_hash },
  })

  return { success: true }
}

export async function deleteStaffUser(userId: string) {
  const barbershopId = await getAdminBarbershopId()
  if (!barbershopId) return { success: false, error: 'Não autorizado' }

  const existing = await prismaClient.user.findFirst({
    where: { id: userId, barbershop_id: barbershopId, login: { not: null } },
  })
  if (!existing) return { success: false, error: 'Usuário não encontrado' }

  // Unlink from barber first
  await prismaClient.barber.updateMany({
    where: { user_id: userId },
    data: { user_id: null },
  })

  await prismaClient.user.delete({ where: { id: userId } })

  return { success: true }
}
