'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { apiGet, errorMessage } from '@/lib/api';
import { useLookups } from '@/lib/useLookups';
import { currencyName } from '@/lib/constants';
import { formatCurrency, formatMonth, formatTxDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import ReturnDateBadge from '@/components/loans/ReturnDateBadge';
import { TransactionAmount, TransactionIcon } from '@/components/transactions/TransactionVisuals';
import type { Account, Transaction, DashboardSummary } from '@/types';
import {
  RiWalletLine, RiArrowUpLine, RiArrowDownLine, RiHandCoinLine,
  RiExchangeDollarLine, RiArrowRightLine, RiArrowLeftSLine, RiArrowRightSLine,
} from 'react-icons/ri';
import Link from 'next/link';

// Taka and Dollar always get their own balance card; other currencies appear when used
const PRIMARY_CURRENCIES = ['BDT', 'USD'];

const BALANCE_STYLES: Record<string, { card: string; icon: string; text: string }> = {
  BDT: { card: 'bg-emerald-500/5! border-emerald-500/20!', icon: 'bg-emerald-500/20 text-emerald-400', text: 'text-emerald-500' },
  USD: { card: 'bg-indigo-500/5! border-indigo-500/20!', icon: 'bg-indigo-500/20 text-indigo-400', text: 'text-indigo-400' },
};
const OTHER_BALANCE_STYLE = { card: '', icon: 'bg-surface-hover text-muted', text: 'text-foreground' };

function currentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default function DashboardPage() {
  const [period, setPeriod] = useState(currentMonth);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { describe } = useLookups();

  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<DashboardSummary>(`/summary/overview?year=${period.year}&month=${period.month}`),
      apiGet<Transaction[]>('/summary/recent?limit=8'),
    ])
      .then(([summaryData, recentData]) => {
        if (!active) return;
        setSummary(summaryData);
        setRecent(recentData);
        setError(null);
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err, 'Could not reach the API.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [retryCount, period]);

  const accounts = useMemo(() => summary?.accounts || [], [summary]);

  // Balances can't be added across currencies, so each currency is totalled separately
  const balances = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>(
      PRIMARY_CURRENCIES.map((c) => [c, { total: 0, count: 0 }]),
    );
    for (const a of accounts) {
      const row = totals.get(a.currency) || { total: 0, count: 0 };
      row.total += a.balance;
      row.count += 1;
      totals.set(a.currency, row);
    }
    const rank = (c: string) => (PRIMARY_CURRENCIES.includes(c) ? PRIMARY_CURRENCIES.indexOf(c) : 99);
    return [...totals.entries()].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
  }, [accounts]);

  const isCurrentMonth = period.year === currentMonth().year && period.month === currentMonth().month;

  function shiftMonth(delta: number) {
    setPeriod(({ year, month }) => {
      const d = new Date(year, month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <RiExchangeDollarLine className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Server connection failed</p>
          <p className="text-sm text-muted mt-1">{error}</p>
        </div>
        <button
          onClick={() => { setError(null); setLoading(true); setRetryCount(c => c + 1); }}
          className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const byCurrency = summary?.byCurrency || [];
  const loans = summary?.loans;
  const receivable = (loans?.byCurrency || []).filter((r) => r.receivable > 0);
  const payable = (loans?.byCurrency || []).filter((r) => r.payable > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Link
          href="/transactions/new"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          + New Transaction
        </Link>
      </div>

      {/* Total balance, one card per currency */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${balances.length > 2 ? 'lg:grid-cols-3' : ''} gap-4`}>
        {balances.map(([currency, { total, count }], i) => {
          const style = BALANCE_STYLES[currency] || OTHER_BALANCE_STYLE;
          return (
            <motion.div key={currency} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
              <Card className={`h-full ${style.card}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                    <RiWalletLine className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted">Total {currencyName(currency)} balance</p>
                    <p className={`text-2xl font-bold truncate ${total < 0 ? 'text-red-500' : style.text}`}>{formatCurrency(total, currency)}</p>
                    <p className="text-xs text-muted mt-0.5">{count} {currency} account{count === 1 ? '' : 's'}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Monthly income / expense */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
            <RiArrowLeftSLine className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[130px] text-center">
            {formatMonth(period.year, period.month)}
          </span>
          <button onClick={() => shiftMonth(1)} disabled={isCurrentMonth} aria-label="Next month" className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
            <RiArrowRightSLine className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-emerald-500/5! border-emerald-500/20! h-full">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <RiArrowUpLine className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted">Income · {summary?.incomeCount || 0} txn</p>
                <CurrencyLines rows={byCurrency.filter(r => r.income > 0).map(r => [r.currency, r.income])} className="text-emerald-500" />
              </div>
            </div>
          </Card>
          <Card className="bg-red-500/5! border-red-500/20! h-full">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <RiArrowDownLine className="w-5 h-5 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted">Expenses · {summary?.expenseCount || 0} txn</p>
                <CurrencyLines rows={byCurrency.filter(r => r.expense > 0).map(r => [r.currency, r.expense])} className="text-red-500" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Loans */}
      {loans && loans.openCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Loans <span className="text-sm font-normal text-muted">· ধার</span></h2>
            <Link href="/loans" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
              View all <RiArrowRightLine className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-sky-500/5! border-sky-500/20!">
              <p className="text-sm text-muted">To receive · পাবো</p>
              <CurrencyLines rows={receivable.map((r) => [r.currency, r.receivable])} className="text-sky-500" />
            </Card>
            <Card className="bg-violet-500/5! border-violet-500/20!">
              <p className="text-sm text-muted">To pay · দেবো</p>
              <CurrencyLines rows={payable.map((r) => [r.currency, r.payable])} className="text-violet-500" />
            </Card>
          </div>
          {loans.upcoming.length > 0 && (
            <Card className="mt-4 p-0! divide-y divide-border">
              <p className="px-4 py-3 text-sm font-medium text-foreground">Upcoming returns · ফেরতের তারিখ</p>
              {loans.upcoming.map((loan) => (
                <Link key={loan._id} href="/loans" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${loan.direction === 'given' ? 'bg-sky-500/10 text-sky-500' : 'bg-violet-500/10 text-violet-500'}`}>
                      <RiHandCoinLine className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {loan.direction === 'given' ? `${loan.person} will pay you` : `You pay ${loan.person}`}
                      </p>
                      <ReturnDateBadge loan={loan} />
                    </div>
                  </div>
                  <p className={`font-semibold whitespace-nowrap ${loan.direction === 'given' ? 'text-sky-500' : 'text-violet-500'}`}>
                    {formatCurrency(loan.outstanding, loan.currency)}
                  </p>
                </Link>
              ))}
            </Card>
          )}
        </div>
      )}

      {accounts.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <RiWalletLine className="w-12 h-12 text-muted/30 mx-auto mb-3" />
            <p className="text-muted">Start by creating an account (Cash, Bank, bKash, Payoneer…)</p>
            <Link href="/accounts" className="text-indigo-400 text-sm hover:text-indigo-300 mt-1 inline-block">
              Create an account
            </Link>
          </div>
        </Card>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Account Balances</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account: Account, i: number) => (
              <motion.div key={account._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                <Link href={`/transactions?accountId=${account._id}`}>
                  <Card hover>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (account.color || '#6366f1') + '20' }}>
                          <RiWalletLine className="w-5 h-5" style={{ color: account.color || '#6366f1' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{account.name}</p>
                          <p className="text-xs text-muted">{account.currency}</p>
                        </div>
                      </div>
                      <p className={`text-lg font-bold ${account.balance < 0 ? 'text-red-500' : 'text-foreground'}`}>
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
          <Link href="/transactions" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
            View all <RiArrowRightLine className="w-4 h-4" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <RiExchangeDollarLine className="w-12 h-12 text-muted/30 mx-auto mb-3" />
              <p className="text-muted">No transactions yet</p>
              <Link href="/transactions/new" className="text-indigo-400 text-sm hover:text-indigo-300 mt-1 inline-block">
                Add your first transaction
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0!">
            {recent.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between gap-3 p-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <TransactionIcon type={tx.type} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge type={tx.type} />
                      <span className="text-sm text-foreground truncate">{describe(tx)}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {formatTxDate(tx.date)}{tx.notes ? ` · ${tx.notes}` : ''}
                    </p>
                  </div>
                </div>
                <TransactionAmount tx={tx} />
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function CurrencyLines({ rows, className }: { rows: [string, number][]; className: string }) {
  if (rows.length === 0) return <p className={`text-2xl font-bold ${className}`}>0</p>;
  return (
    <>
      {rows.map(([currency, amount]) => (
        <p key={currency} className={`text-xl font-bold truncate ${className}`}>{formatCurrency(amount, currency)}</p>
      ))}
    </>
  );
}
