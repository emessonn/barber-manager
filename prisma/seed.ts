import { prismaClient } from "@/lib/prisma";

const barbershop = await prismaClient.barbershop.create({
  data: {
    name: "Barbearia Premium",
    slug: "premium-barbershop",
    address: "Rua das Flores, 123 - São Paulo, SP",
    phone: "+55 11 98765-4321",
    logo_url: "https://via.placeholder.com/200",
    comission_rate: 20,
  },
});

const users = await prismaClient.user.createMany({
  data: [
    {
      email: "admin@premium.com",
      name: "Admin Premium",
      role: "ADMIN",
      barbershop_id: barbershop.id,
    },
    {
      email: "barbeiro@premium.com",
      name: "João Barbeiro",
      role: "BARBER",
      barbershop_id: barbershop.id,
    },
  ],
});

const barbers = await prismaClient.barber.createMany({
  data: [
    {
      name: "João Barbeiro",
      phone: "+55 11 98765-4321",
      barbershop_id: barbershop.id,
      commission_percentage: 20,
      working_hours: {
        monday: { start: "09:00", end: "18:00", break_time: 60 },
        tuesday: { start: "09:00", end: "18:00", break_time: 60 },
        wednesday: { start: "09:00", end: "18:00", break_time: 60 },
        thursday: { start: "09:00", end: "18:00", break_time: 60 },
        friday: { start: "09:00", end: "19:00", break_time: 60 },
        saturday: { start: "09:00", end: "15:00", break_time: 30 },
        sunday: { start: null, end: null, break_time: 0 },
      },
    },
  ],
});

const services = await prismaClient.service.createMany({
  data: [
    {
      name: "Corte de Cabelo",
      price: 50.0,
      duration_minutes: 30,
      description: "Corte clássico com acabamento premium",
      barbershop_id: barbershop.id,
      is_active: true,
    },
    {
      name: "Corte + Barba",
      price: 80.0,
      duration_minutes: 45,
      description: "Corte de cabelo + design de barba",
      barbershop_id: barbershop.id,
      is_active: true,
    },
    {
      name: "Barba",
      price: 35.0,
      duration_minutes: 20,
      description: "Design e aparação de barba",
      barbershop_id: barbershop.id,
      is_active: true,
    },
  ],
});

console.log("✅ Database seeded successfully!");
