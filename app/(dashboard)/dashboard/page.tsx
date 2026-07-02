'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate, getTransactionColor, getTransactionBgColor } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import type { Account, Transaction, DashboardSummary } from '@/types';
import {
  RiWalletLine, RiArrowUpLine, RiArrowDownLine,
  RiExchangeDollarLine, RiArrowRightLine,
} from 'react-icons/ri';
import Link from 'next/link';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryData, recentData] = await Promise.all([
          apiGet<DashboardSummary>('/summary/overview'),
          apiGet<Transaction[]>('/summary/recent'),
        ]);
        setSummary(summaryData);
        setRecent(recentData);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [retryCount]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
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
          <p className="text-sm text-muted mt-1">Could not reach the API. Please try again.</p>
        </div>
        <button
          onClick={() => { setError(false); setLoading(true); setRetryCount(c => c + 1); }}
          className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const accounts = summary?.accounts || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Link href="/transactions/new">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/25"
          >
            + New Transaction
          </motion.button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="!bg-indigo-500/5 !border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <RiWalletLine className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-muted">Total Accounts</p>
                <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="!bg-emerald-500/5 !border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <RiArrowUpLine className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted">Monthly Income</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {formatCurrency(summary?.totalIncome || 0)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="!bg-red-500/5 !border-red-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <RiArrowDownLine className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(summary?.totalExpense || 0)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {accounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Account Balances</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account: Account, i: number) => (
              <motion.div key={account._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
                <Card hover>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (account.color || '#6366f1') + '20' }}>
                        <RiWalletLine className="w-5 h-5" style={{ color: account.color || '#6366f1' }} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{account.name}</p>
                        <p className="text-xs text-muted">{account.currency}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>
                </Card>
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
          <Card className="divide-y divide-border !p-0">
            {recent.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTransactionBgColor(tx.type)}`}>
                    {tx.type === 'income' ? <RiArrowUpLine className={`w-4 h-4 ${getTransactionColor(tx.type)}`} /> :
                     tx.type === 'expense' ? <RiArrowDownLine className={`w-4 h-4 ${getTransactionColor(tx.type)}`} /> :
                     <RiExchangeDollarLine className={`w-4 h-4 ${getTransactionColor(tx.type)}`} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge type={tx.type} />
                      {tx.notes && <span className="text-sm text-muted truncate max-w-[150px]">{tx.notes}</span>}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                  {tx.type === 'income' && '+'}
                  {tx.type === 'expense' && '-'}
                  {tx.type === 'transfer'
                    ? formatCurrency(tx.fromAmount || 0, tx.fromCurrency)
                    : formatCurrency(tx.amount || 0, tx.currency)}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
