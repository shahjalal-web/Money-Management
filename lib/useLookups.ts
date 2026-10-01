'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { Account, ExpenseCategory, IncomeSource, Transaction } from '@/types';

export interface Lookups {
  accounts: Account[];
  incomeSources: IncomeSource[];
  expenseCategories: ExpenseCategory[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Human label for a transaction, e.g. "Upwork → Payoneer" or "Bank → Rahim" */
  describe: (tx: Transaction) => string;
}

interface LookupsResponse {
  accounts: Account[];
  incomeSources: IncomeSource[];
  expenseCategories: ExpenseCategory[];
}

const NONE: never[] = [];

// Accounts, income sources and expense categories — the reference data most pages need.
// One cached request shared by every page.
export function useLookups(): Lookups {
  const { data, loading, error, reload } = useApi<LookupsResponse>('/lookups');
  const accounts = data?.accounts ?? NONE;
  const incomeSources = data?.incomeSources ?? NONE;
  const expenseCategories = data?.expenseCategories ?? NONE;

  const describe = useMemo(() => {
    const names = new Map<string, string>();
    for (const a of accounts) names.set(a._id, a.name);
    for (const s of incomeSources) names.set(s._id, s.name);
    for (const c of expenseCategories) names.set(c._id, c.name);
    // Deleted (soft-deleted) items aren't returned by the API
    const name = (id?: string) => (id && names.get(id)) || 'Deleted';

    return (tx: Transaction) => {
      if (tx.type === 'income') return `${name(tx.incomeSourceId)} → ${name(tx.accountId)}`;
      if (tx.type === 'expense') return `${name(tx.accountId)} → ${name(tx.expenseCategoryId)}`;
      // Money leaves the account for lend/repay, arrives for borrow/collect
      if (tx.type === 'lend' || tx.type === 'repay') return `${name(tx.accountId)} → ${tx.person || 'Someone'}`;
      if (tx.type === 'borrow' || tx.type === 'collect') return `${tx.person || 'Someone'} → ${name(tx.accountId)}`;
      return `${name(tx.fromAccountId)} → ${name(tx.toAccountId)}`;
    };
  }, [accounts, incomeSources, expenseCategories]);

  return { accounts, incomeSources, expenseCategories, loading, error, reload, describe };
}
