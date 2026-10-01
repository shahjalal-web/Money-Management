'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/lib/useApi';
import { useLookups } from '@/lib/useLookups';
import { useAuth } from '@/contexts/AuthContext';
import { currencyName } from '@/lib/constants';
import { cn, formatCurrency, formatMonth, formatTxDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import TrendChart, { type TrendPoint } from '@/components/charts/TrendChart';
import CategoryBars from '@/components/charts/CategoryBars';
import ReturnDateBadge from '@/components/loans/ReturnDateBadge';
import { TransactionAmount, TransactionIcon } from '@/components/transactions/TransactionVisuals';
import type { DashboardData } from '@/types';
import {
  RiArrowUpLine, RiArrowDownLine, RiArrowLeftRightLine, RiHandCoinLine, RiWalletLine,
  RiArrowRightLine, RiArrowLeftSLine, RiArrowRightSLine, RiExchangeDollarLine, RiRefreshLine,
} from 'react-icons/ri';

// Taka and Dollar are always offered; other currencies appear once an account uses them
const PRIMARY_CURRENCIES = ['BDT', 'USD'];

function currentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const QUICK_ACTIONS = [
  { href: '/transactions/new?tab=income', label: 'Income', icon: RiArrowUpLine, tone: 'bg-emerald-500/10 text-emerald-500' },
  { href: '/transactions/new?tab=expense', label: 'Expense', icon: RiArrowDownLine, tone: 'bg-red-500/10 text-red-500' },
  { href: '/transactions/new?tab=transfer', label: 'Transfer', icon: RiArrowLeftRightLine, tone: 'bg-amber-500/10 text-amber-500' },
  { href: '/transactions/new?tab=loan', label: 'Loan', icon: RiHandCoinLine, tone: 'bg-sky-500/10 text-sky-500' },
];

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState(currentMonth);
  const [picked, setPicked] = useState<string | null>(null);
  const { accounts, describe, loading: lookupsLoading } = useLookups();
  const { data, error, refreshing, reload } = useApi<DashboardData>(
    `/summary/dashboard?year=${period.year}&month=${period.month}`,
  );

  // Balance per currency from the (shared, cached) accounts list
  const balances = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>(PRIMARY_CURRENCIES.map((c) => [c, { total: 0, count: 0 }]));
    for (const a of accounts) {
      const row = totals.get(a.currency) || { total: 0, count: 0 };
      row.total += a.balance;
      row.count += 1;
      totals.set(a.currency, row);
    }
    const rank = (c: string) => (PRIMARY_CURRENCIES.includes(c) ? PRIMARY_CURRENCIES.indexOf(c) : 99);
    return [...totals.entries()].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
  }, [accounts]);

  const currencies = balances.map(([c]) => c);
  const fallback = profile?.defaultCurrency && currencies.includes(profile.defaultCurrency) ? profile.defaultCurrency : currencies[0];
  const currency = picked && currencies.includes(picked) ? picked : fallback;
  const balance = balances.find(([c]) => c === currency)?.[1].total ?? 0;

  const month = data?.byCurrency.find((r) => r.currency === currency) ?? { income: 0, expense: 0 };
  const trend: TrendPoint[] = (data?.trend ?? []).map((t) => ({
    year: t.year, month: t.month,
    income: t.byCurrency[currency]?.income ?? 0,
    expense: t.byCurrency[currency]?.expense ?? 0,
  }));
  const categories = (data?.expenseByCategory ?? []).filter((c) => c.currency === currency);
  const net = month.income - month.expense;

  const isCurrentMonth = period.year === currentMonth().year && period.month === currentMonth().month;
  function shiftMonth(delta: number) {
    setPeriod(({ year, month: m }) => {
      const d = new Date(year, m - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  const firstName = (profile?.displayName || user?.displayName || '').split(' ')[0];
  const loans = data?.loans;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{greeting()}{firstName ? ',' : ''}</p>
          <h1 className="text-2xl font-bold text-foreground leading-tight">{firstName || 'Dashboard'}</h1>
        </div>
        {refreshing && <RiRefreshLine className="w-4 h-4 text-muted animate-spin mb-1.5" aria-label="Updating" />}
      </div>

      {/* Hero: balance per currency */}
      <section className="relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/20">
        <div aria-hidden className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -right-4 bottom-[-60px] w-40 h-40 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-sm text-white/75">Total balance · {currencyName(currency)}</p>
          {lookupsLoading ? (
            <div className="h-11 w-48 mt-1 rounded-lg bg-white/20 animate-pulse" />
          ) : (
            <p className={cn('text-4xl sm:text-5xl font-bold tracking-tight mt-1 break-all', balance < 0 && 'text-red-200')}>
              {formatCurrency(balance, currency)}
            </p>
          )}

          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Currency">
            {balances.map(([c, { total }]) => (
              <button
                key={c}
                role="tab"
                aria-selected={c === currency}
                onClick={() => setPicked(c)}
                className={cn(
                  'flex-shrink-0 rounded-xl px-3 py-1.5 text-left transition-colors',
                  c === currency ? 'bg-white text-indigo-700' : 'bg-white/15 text-white hover:bg-white/25',
                )}
              >
                <span className="block text-[11px] font-semibold opacity-80">{c}</span>
                <span className="block text-sm font-bold whitespace-nowrap">{formatCurrency(total, c)}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/15">
            <div>
              <p className="flex items-center gap-1 text-xs text-white/75"><RiArrowUpLine className="w-3.5 h-3.5" /> Income · {formatMonth(period.year, period.month).split(' ')[0]}</p>
              <p className="text-lg font-semibold whitespace-nowrap">{data ? formatCurrency(month.income, currency) : '…'}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-white/75"><RiArrowDownLine className="w-3.5 h-3.5" /> Expense</p>
              <p className="text-lg font-semibold whitespace-nowrap">{data ? formatCurrency(month.expense, currency) : '…'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.label} href={a.href} className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface border border-border py-3 active:scale-95 hover:bg-surface-hover transition">
            <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center', a.tone)}>
              <a.icon className="w-5 h-5" />
            </span>
            <span className="text-xs font-medium text-foreground">{a.label}</span>
          </Link>
        ))}
      </div>

      {error && !data ? (
        <Card>
          <div className="text-center py-8">
            <p className="font-medium text-foreground">Couldn&apos;t load your summary</p>
            <p className="text-sm text-muted mt-1 mb-4">{error}</p>
            <button onClick={reload} className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-sm font-medium">Retry</button>
          </div>
        </Card>
      ) : (
        <>
          {/* Month switcher scopes everything below */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Insights</h2>
            <div className="flex items-center gap-1 rounded-xl bg-surface border border-border p-0.5">
              <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover">
                <RiArrowLeftSLine className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-foreground min-w-[112px] text-center">{formatMonth(period.year, period.month)}</span>
              <button onClick={() => shiftMonth(1)} disabled={isCurrentMonth} aria-label="Next month" className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover disabled:opacity-30">
                <RiArrowRightSLine className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4! sm:p-5!">
              <h3 className="text-sm font-semibold text-foreground">Income vs expense</h3>
              <p className="text-xs text-muted mb-3">Last 6 months · {currency}</p>
              {data ? <TrendChart data={trend} currency={currency} selected={trend.length - 1} /> : <Skeleton className="h-48" />}
            </Card>

            <Card className="p-4! sm:p-5!">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Where the money went</h3>
                  <p className="text-xs text-muted">{formatMonth(period.year, period.month)} · {currency}</p>
                </div>
                {data && (month.income > 0 || month.expense > 0) && (
                  <div className="text-right">
                    <p className="text-xs text-muted">{net >= 0 ? 'Saved' : 'Overspent'}</p>
                    <p className={cn('text-sm font-semibold', net >= 0 ? 'text-emerald-500' : 'text-red-500')}>{formatCurrency(Math.abs(net), currency)}</p>
                  </div>
                )}
              </div>
              {data ? <CategoryBars rows={categories} currency={currency} /> : <Skeleton className="h-48" />}
            </Card>
          </div>

          {/* Loans */}
          {loans && loans.openCount > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground">Loans <span className="text-sm font-normal text-muted">· ধার</span></h2>
                <Link href="/loans" className="flex items-center gap-1 text-sm text-indigo-400">All <RiArrowRightLine className="w-4 h-4" /></Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4! bg-sky-500/5! border-sky-500/20!">
                  <p className="text-xs text-muted">To receive · পাবো</p>
                  {loans.byCurrency.filter((r) => r.receivable > 0).map((r) => (
                    <p key={r.currency} className="text-lg font-bold text-sky-500 truncate">{formatCurrency(r.receivable, r.currency)}</p>
                  ))}
                  {!loans.byCurrency.some((r) => r.receivable > 0) && <p className="text-lg font-bold text-muted">0</p>}
                </Card>
                <Card className="p-4! bg-violet-500/5! border-violet-500/20!">
                  <p className="text-xs text-muted">To pay · দেবো</p>
                  {loans.byCurrency.filter((r) => r.payable > 0).map((r) => (
                    <p key={r.currency} className="text-lg font-bold text-violet-500 truncate">{formatCurrency(r.payable, r.currency)}</p>
                  ))}
                  {!loans.byCurrency.some((r) => r.payable > 0) && <p className="text-lg font-bold text-muted">0</p>}
                </Card>
              </div>
              {loans.upcoming.length > 0 && (
                <Card className="mt-3 p-0! divide-y divide-border overflow-hidden">
                  {loans.upcoming.map((loan) => (
                    <Link key={loan._id} href="/loans" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{loan.direction === 'given' ? `${loan.person} will pay you` : `You pay ${loan.person}`}</p>
                        <ReturnDateBadge loan={loan} />
                      </div>
                      <p className={cn('font-semibold whitespace-nowrap', loan.direction === 'given' ? 'text-sky-500' : 'text-violet-500')}>
                        {formatCurrency(loan.outstanding, loan.currency)}
                      </p>
                    </Link>
                  ))}
                </Card>
              )}
            </section>
          )}

          {/* Accounts: swipe row on phones, grid on larger screens */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
              <Link href="/accounts" className="flex items-center gap-1 text-sm text-indigo-400">Manage <RiArrowRightLine className="w-4 h-4" /></Link>
            </div>
            {accounts.length === 0 && !lookupsLoading ? (
              <Card>
                <div className="text-center py-6">
                  <RiWalletLine className="w-10 h-10 text-muted/30 mx-auto mb-2" />
                  <p className="text-sm text-muted">Create an account (Cash, bKash, Bank, Payoneer…) to start</p>
                  <Link href="/accounts" className="text-indigo-400 text-sm mt-1 inline-block">Create an account</Link>
                </div>
              </Card>
            ) : (
              <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
                {accounts.map((account) => (
                  <Link
                    key={account._id}
                    href={`/transactions?accountId=${account._id}`}
                    className="snap-start flex-shrink-0 w-[70%] sm:w-auto rounded-2xl bg-surface border border-border p-4 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (account.color || '#6366f1') + '22' }}>
                        <RiWalletLine className="w-4 h-4" style={{ color: account.color || '#6366f1' }} />
                      </span>
                      <span className="font-medium text-foreground truncate">{account.name}</span>
                      <span className="ml-auto text-[11px] text-muted">{account.currency}</span>
                    </div>
                    <p className={cn('text-xl font-bold', account.balance < 0 ? 'text-red-500' : 'text-foreground')}>
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Recent</h2>
              <Link href="/transactions" className="flex items-center gap-1 text-sm text-indigo-400">See all <RiArrowRightLine className="w-4 h-4" /></Link>
            </div>
            {!data ? (
              <Skeleton className="h-40" />
            ) : data.recent.length === 0 ? (
              <Card>
                <div className="text-center py-6">
                  <RiExchangeDollarLine className="w-10 h-10 text-muted/30 mx-auto mb-2" />
                  <p className="text-sm text-muted">No transactions yet</p>
                  <Link href="/transactions/new" className="text-indigo-400 text-sm mt-1 inline-block">Add your first one</Link>
                </div>
              </Card>
            ) : (
              <Card className="divide-y divide-border p-0! overflow-hidden">
                {data.recent.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <TransactionIcon type={tx.type} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{describe(tx)}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge type={tx.type} />
                          <span className="text-xs text-muted truncate">{formatTxDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>
                    <TransactionAmount tx={tx} />
                  </div>
                ))}
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
