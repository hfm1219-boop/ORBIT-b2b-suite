import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

export const normalizePhoneNumber = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `57${cleaned}`;
  return cleaned;
};
