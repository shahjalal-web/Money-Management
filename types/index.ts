export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  _id: string;
  userId: string;
  name: string;
  currency: string;
  balance: number;
  /** Balance carried over from before tracking started (not income) */
  openingBalance?: number;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeSource {
  _id: string;
  userId: string;
  name: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  _id: string;
  userId: string;
  name: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LoanTransactionType = 'lend' | 'borrow' | 'repay' | 'collect';
export type TransactionType = 'income' | 'expense' | 'transfer' | LoanTransactionType;

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  accountId?: string;
  incomeSourceId?: string;
  expenseCategoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount?: number;
  currency?: string;
  fromAmount?: number;
  fromCurrency?: string;
  toAmount?: number;
  toCurrency?: string;
  exchangeRate?: number;
  fee?: number;
  loanId?: string;
  person?: string;
  notes?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  transactions: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CurrencyTotals {
  currency: string;
  income: number;
  expense: number;
}

export interface DashboardSummary {
  accounts: Account[];
  totalIncome: number;
  totalExpense: number;
  incomeCount: number;
  expenseCount: number;
  byCurrency: CurrencyTotals[];
  year: number;
  month: number;
  loans: LoanSummary;
}

export type LoanDirection = 'given' | 'taken';
export type ReturnDateType = 'expected' | 'final';

export interface Loan {
  _id: string;
  userId: string;
  /** given = I lent (ধার দেয়া), taken = I borrowed (ধার নেয়া) */
  direction: LoanDirection;
  person: string;
  /** Old loan entered for record only; moved no account money */
  isPrevious?: boolean;
  accountId: string | null;
  principal: number;
  /** Part already returned before a previous loan was entered */
  initialRepaid?: number;
  repaidAmount: number;
  outstanding: number;
  currency: string;
  status: 'open' | 'settled';
  date: string;
  returnDate: string | null;
  returnDateType: ReturnDateType | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanDetail extends Loan {
  transactions: Transaction[];
}

export interface LoanSummary {
  byCurrency: { currency: string; receivable: number; payable: number }[];
  openCount: number;
  upcoming: Loan[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
