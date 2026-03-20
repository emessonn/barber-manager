import { z } from 'zod'

// ==================== AUTH VALIDATORS ====================
export const loginFormSchema = z.object({
  email: z.string().email('Email inválido'),
})

// ==================== BOOKING VALIDATORS ====================
export const createBookingSchema = z.object({
  barber_id: z.string().min(1, 'Barbeiro inválido'),
  service_id: z.string().min(1, 'Serviço inválido'),
  client_name: z.string().min(2, 'Nome é obrigatório'),
  client_phone: z.string().min(10, 'Telefone inválido'),
  client_email: z.string().email().optional().or(z.literal('')),
  date_time: z
    .string()
    .refine(
      (val) => new Date(val) > new Date(),
      'Data e hora devem estar no futuro',
    ),
  notes: z.string().optional(),
})

// ==================== SERVICE VALIDATORS ====================
export const createServiceSchema = z.object({
  name: z.string().min(3, 'Nome do serviço obrigatório'),
  price: z
    .number()
    .min(0.01, 'Preço deve ser maior que 0')
    .max(10000, 'Preço muito alto'),
  duration_minutes: z
    .number()
    .min(5, 'Duração mínima: 5 minutos')
    .max(480, 'Duração máxima: 8 horas'),
  description: z.string().optional(),
  image_url: z.string().nullable().optional(),
})

// ==================== BARBER VALIDATORS ====================
export const createBarberSchema = z.object({
  name: z.string().min(3, 'Nome do barbeiro obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  commission_percentage: z
    .number()
    .min(0, 'Comissão não pode ser negativa')
    .max(100, 'Comissão não pode ser maior que 100%'),
  avatar_url: z.string().optional(),
})

// ==================== FINANCIAL VALIDATORS ====================
export const createFinancialRecordSchema = z.object({
  type: z.enum(['ENTRADA', 'SAIDA']),
  amount: z.number().min(0.01, 'Valor deve ser maior que 0'),
  description: z.string().min(3, 'Descrição obrigatória'),
  category: z.string().optional(),
})

// ==================== ONBOARDING VALIDATORS ====================
export const createBarbershopSchema = z.object({
  name: z.string().min(3, 'Nome da barbearia obrigatório'),
  slug: z
    .string()
    .min(3, 'Slug obrigatório')
    .max(50, 'Slug muito longo')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  phone: z.string().min(10, 'Telefone inválido'),
  address: z.string().min(5, 'Endereço obrigatório'),
  logo_url: z.string().optional(),
})

export type CreateBarbershopInput = z.infer<typeof createBarbershopSchema>

// ==================== BARBERSHOP WORKING HOURS ====================
const dayHoursSchema = z.object({
  open: z.boolean(),
  start: z.string().nullable(),
  end: z.string().nullable(),
})

const WORKING_HOURS_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export const workingHoursSchema = z.object(
  Object.fromEntries(
    WORKING_HOURS_DAYS.map((d) => [d, dayHoursSchema]),
  ) as Record<(typeof WORKING_HOURS_DAYS)[number], typeof dayHoursSchema>,
)

export type WorkingHours = z.infer<typeof workingHoursSchema>

// ==================== INVENTORY VALIDATORS ====================
export const createInventoryItemSchema = z.object({
  name: z.string().min(3, 'Nome do item obrigatório'),
  quantity: z.number().min(0, 'Quantidade não pode ser negativa'),
  min_quantity: z.number().min(0, 'Quantidade mínima não pode ser negativa'),
  unit_price: z.number().min(0.01, 'Preço deve ser maior que 0'),
  category: z.enum(['CONSUMO', 'REVENDA']),
  description: z.string().optional(),
})
