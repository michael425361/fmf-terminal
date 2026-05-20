import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(value: number, decimals = 2): string {
  if (value >= 1000) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  if (value > 0 && value < 10) {
    return value.toFixed(4);
  }
  return value.toFixed(decimals);
}
