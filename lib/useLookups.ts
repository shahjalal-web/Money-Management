'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet } from './api';
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

// Accounts, income sources and expense categories — the reference data most pages need
export function useLookups(): Lookups {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<Account[]>('/accounts'),
      apiGet<IncomeSource[]>('/income-sources'),
      apiGet<ExpenseCategory[]>('/expense-categories'),
    ])
      .then(([acc, src, cat]) => {
        if (!active) return;
        setAccounts(acc);
        setIncomeSources(src);
        setExpenseCategories(cat);
        setError(null);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

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
