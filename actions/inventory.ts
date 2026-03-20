'use server'

import { prismaClient } from '@/lib/prisma'
import { createInventoryItemSchema } from '@/lib/validators'

export async function createInventoryItem(
  barbershop_id: string,
  data: unknown,
) {
  try {
    const validated = createInventoryItemSchema.parse(data)

    const item = await prismaClient.inventoryItem.create({
      data: {
        ...validated,
        barbershop_id,
      },
    })

    return { success: true, item }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function updateInventoryItem(item_id: string, data: unknown) {
  try {
    const validated = createInventoryItemSchema.parse(data)

    const item = await prismaClient.inventoryItem.update({
      where: { id: item_id },
      data: validated,
    })

    return { success: true, item }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function deleteInventoryItem(item_id: string) {
  try {
    await prismaClient.inventoryItem.delete({
      where: { id: item_id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
