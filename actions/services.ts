"use server";

import { prismaClient } from "@/lib/prisma";
import { createServiceSchema } from "@/lib/validators";

export async function createService(
  barbershop_id: string,
  data: unknown
) {
  try {
    const validated = createServiceSchema.parse(data);

    const service = await prismaClient.service.create({
      data: {
        ...validated,
        barbershop_id,
      },
    });

    return { success: true, service };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateService(
  service_id: string,
  data: unknown
) {
  try {
    const validated = createServiceSchema.parse(data);

    const service = await prismaClient.service.update({
      where: { id: service_id },
      data: validated,
    });

    return { success: true, service };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteService(service_id: string) {
  try {
    await prismaClient.service.delete({
      where: { id: service_id },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
