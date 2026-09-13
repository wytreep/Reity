export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  APP_NAME: 'Reity',
  CURRENCY: 'COP',
  LOCALE: 'es-CO',
} as const;

export const formatCOP = (amount: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
