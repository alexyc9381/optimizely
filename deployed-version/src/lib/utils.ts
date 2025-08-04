import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'running':
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'paused':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
    case 'done':
      return 'bg-blue-100 text-blue-800'
    case 'draft':
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'error':
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
