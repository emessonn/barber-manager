import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata data para formato brasileiro (DD/MM/YYYY HH:mm)
 */
export function formatDateBR(date: Date): string {
  return date.toLocaleString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata moeda para Real brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Calcula a comissão baseado no preço e percentual
 */
export function calculateCommission(price: number, percentage: number): number {
  return (price * percentage) / 100;
}

/**
 * Formata número de telefone brasileiro
 * Ex: "11987654321" → "(11) 98765-4321"
 *     "1134567890"  → "(11) 3456-7890"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

/**
 * Valida se um email pertence a um domínio específico (opcional para multi-tenant)
 */
export function isEmailFromDomain(
  email: string,
  domain: string
): boolean {
  return email.endsWith(`@${domain}`);
}
