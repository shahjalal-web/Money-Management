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

export type TransactionType = 'income' | 'expense' | 'transfer';

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

export interface DashboardSummary {
  accounts: Account[];
  totalIncome: number;
  totalExpense: number;
  incomeCount: number;
  expenseCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
