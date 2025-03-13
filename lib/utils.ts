import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Address {
  address: string
  city: string
  state: string
  zip: string
}

export function formatAddress(address: Address): string {
  if (!address) return 'N/A'
  
  return `${address.address}, ${address.city}, ${address.state} ${address.zip}`
}
