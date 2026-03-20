'use server'

import { auth } from '@/lib/auth'
import { prismaClient } from '@/lib/prisma'
import { createFinancialRecordSchema } from '@/lib/validators'

export async function createFinancialRecord(
  barbershop_id: string,
  data: unknown,
) {
  try {
    const session = await auth()
    const validated = createFinancialRecordSchema.parse(data)

    const record = await prismaClient.financialRecord.create({
      data: {
        ...validated,
        barbershop_id,
        user_id: session?.user?.id ?? null,
      },
    })

    return { success: true, record }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function deleteFinancialRecord(record_id: string) {
  try {
    await prismaClient.financialRecord.delete({
      where: { id: record_id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
