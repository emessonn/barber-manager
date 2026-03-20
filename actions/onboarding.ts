'use server'

import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { createBarbershopSchema } from '@/lib/validators'

export async function createBarbershop(data: unknown) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: 'Não autorizado' }
  }

  const parsed = createBarbershopSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, slug, phone, address, logo_url } = parsed.data

  // Check slug uniqueness
  const existing = await prismaClient.barbershop.findUnique({ where: { slug } })
  if (existing) {
    return { error: 'Este slug já está em uso. Escolha outro.' }
  }

  // Check if user already has a barbershop
  // Lookup by ID first; fallback to email in case the JWT token has a stale/mismatched ID
  let user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, barbershop_id: true },
  })

  if (!user && session.user.email) {
    user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, barbershop_id: true },
    })
  }

  if (!user) {
    return { error: 'Usuário não encontrado. Faça login novamente.' }
  }
  if (user.barbershop_id) {
    return { error: 'Você já possui uma barbearia cadastrada.' }
  }

  const barbershop = await prismaClient.barbershop.create({
    data: { name, slug, phone, address, logo_url },
  })

  await prismaClient.user.update({
    where: { id: user.id },
    data: { barbershop_id: barbershop.id, role: 'ADMIN' },
  })

  return { success: true, slug: barbershop.slug }
}
