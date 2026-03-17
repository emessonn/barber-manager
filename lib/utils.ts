import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
 * Valida se um email pertence a um domínio específico (opcional para multi-tenant)
 */
export function isEmailFromDomain(
  email: string,
  domain: string
): boolean {
  return email.endsWith(`@${domain}`);
}
