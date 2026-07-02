export function formatCurrency(amount: number, currency: string = 'BDT'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'BDT' ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getTransactionColor(type: string): string {
  switch (type) {
    case 'income': return 'text-emerald-500';
    case 'expense': return 'text-red-500';
    case 'transfer': return 'text-amber-500';
    default: return 'text-gray-500';
  }
}

export function getTransactionBgColor(type: string): string {
  switch (type) {
    case 'income': return 'bg-emerald-500/10';
    case 'expense': return 'bg-red-500/10';
    case 'transfer': return 'bg-amber-500/10';
    default: return 'bg-gray-500/10';
  }
}
