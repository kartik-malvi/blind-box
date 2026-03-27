import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Rarity } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const rarityColors: Record<Rarity, string> = {
  common: 'bg-gray-100 text-gray-700',
  uncommon: 'bg-green-100 text-green-700',
  rare: 'bg-blue-100 text-blue-700',
  legendary: 'bg-yellow-100 text-yellow-700',
};

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}
