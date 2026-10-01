export const CURRENCIES = [
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

export const ACCOUNT_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#3b82f6',
];

// Short labels for badges; Bangla shown alongside in loan forms
export const TRANSACTION_LABELS: Record<string, string> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  lend: 'Lent',
  borrow: 'Borrowed',
  repay: 'Repaid',
  collect: 'Collected',
};

export const LOAN_ACTIONS = {
  lend: { label: 'Lend', bn: 'ধার দেয়া', hint: 'You give money to someone' },
  borrow: { label: 'Borrow', bn: 'ধার নেয়া', hint: 'You take money from someone' },
  repay: { label: 'Repay', bn: 'পরিশোধ করা', hint: 'You pay back money you borrowed' },
  collect: { label: 'Collect', bn: 'পরিশোধ পাওয়া', hint: 'Someone pays back money you lent' },
} as const;

export function currencyName(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.name || code;
}
