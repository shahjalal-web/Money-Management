const NARROW_SYMBOL_CURRENCIES = new Set(['BDT', 'MYR']);

export function formatCurrency(amount: number, currency: string = 'BDT'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    // en-US prints "BDT 1,500"; ৳ / RM are unambiguous, unlike the narrow "$" for CAD/AUD/SGD
    currencyDisplay: NARROW_SYMBOL_CURRENCIES.has(currency) ? 'narrowSymbol' : 'symbol',
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
    case 'lend': return 'text-sky-500';
    case 'borrow': return 'text-violet-500';
    case 'repay': return 'text-orange-500';
    case 'collect': return 'text-teal-500';
    default: return 'text-gray-500';
  }
}

export function getTransactionBgColor(type: string): string {
  switch (type) {
    case 'income': return 'bg-emerald-500/10';
    case 'expense': return 'bg-red-500/10';
    case 'transfer': return 'bg-amber-500/10';
    case 'lend': return 'bg-sky-500/10';
    case 'borrow': return 'bg-violet-500/10';
    case 'repay': return 'bg-orange-500/10';
    case 'collect': return 'bg-teal-500/10';
    default: return 'bg-gray-500/10';
  }
}

/** Today's date as YYYY-MM-DD in the user's local timezone (for <input type="date">) */
export function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Transaction dates are stored as UTC midnight of the picked day; show that day
// regardless of the viewer's timezone
export function formatTxDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

export function formatMonth(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

/** +1 when the transaction adds money to an account, -1 when it takes money out, 0 for transfers */
export function transactionSign(type: string): 1 | -1 | 0 {
  if (type === 'income' || type === 'borrow' || type === 'collect') return 1;
  if (type === 'expense' || type === 'lend' || type === 'repay') return -1;
  return 0;
}

/** Whole days from today (local) until a stored UTC-midnight date; negative = overdue */
export function daysUntil(date: string | Date): number {
  const d = new Date(date);
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}
