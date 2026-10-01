'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiGet, apiDelete, errorMessage } from '@/lib/api';
import { useLookups } from '@/lib/useLookups';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import { formatTxDate } from '@/lib/utils';
import { TransactionAmount, TransactionIcon } from '@/components/transactions/TransactionVisuals';
import type { Transaction, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';
import { RiExchangeDollarLine, RiDeleteBinLine, RiAddLine, RiFilterLine, RiCloseLine } from 'react-icons/ri';

const PAGE_SIZE = 15;
const TYPE_OPTIONS = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'lend', label: 'Lent (ধার দেয়া)' },
  { value: 'borrow', label: 'Borrowed (ধার নেয়া)' },
  { value: 'repay', label: 'Repaid (পরিশোধ করা)' },
  { value: 'collect', label: 'Collected (পরিশোধ পাওয়া)' },
];
const EMPTY_FILTERS = { type: '', accountId: '', startDate: '', endDate: '', page: 1 };

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}>
      <TransactionsList />
    </Suspense>
  );
}

function TransactionsList() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => ({ ...EMPTY_FILTERS, accountId: searchParams.get('accountId') || '' }));
  const [data, setData] = useState<PaginatedResponse<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { accounts, describe, reload: reloadLookups } = useLookups();

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.accountId) params.set('accountId', filters.accountId);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    params.set('page', String(filters.page));
    params.set('limit', String(PAGE_SIZE));

    apiGet<PaginatedResponse<Transaction>>(`/transactions?${params.toString()}`)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err, 'Failed to load transactions'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [filters, reloadKey]);

  function updateFilters(patch: Partial<typeof EMPTY_FILTERS>) {
    setLoading(true);
    setFilters((f) => ({ ...f, page: 1, ...patch }));
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction? This will reverse the balance change.')) return;
    setDeletingId(id);
    try {
      await apiDelete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      // Step back a page if we just removed the last row on this one
      if (data && data.transactions.length === 1 && filters.page > 1) {
        setFilters((f) => ({ ...f, page: f.page - 1 }));
      } else {
        setReloadKey((k) => k + 1);
      }
      reloadLookups();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to delete'));
    } finally {
      setDeletingId(null);
    }
  }

  const transactions = data?.transactions || [];
  const hasFilters = !!(filters.type || filters.accountId || filters.startDate || filters.endDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <Link href="/transactions/new"><Button size="sm"><RiAddLine className="w-4 h-4" /> New</Button></Link>
      </div>

      <Card className="p-4!">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RiFilterLine className="w-4 h-4 text-muted" />
            <span className="text-sm text-muted">Filters</span>
          </div>
          {hasFilters && (
            <button onClick={() => updateFilters(EMPTY_FILTERS)} className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors">
              <RiCloseLine className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select aria-label="Type" placeholder="All types" options={TYPE_OPTIONS} value={filters.type} onChange={(e) => updateFilters({ type: e.target.value })} />
          <Select aria-label="Account" placeholder="All accounts" options={accounts.map((a) => ({ value: a._id, label: `${a.name} (${a.currency})` }))} value={filters.accountId} onChange={(e) => updateFilters({ accountId: e.target.value })} />
          <Input aria-label="Start date" type="date" value={filters.startDate} max={filters.endDate || undefined} onChange={(e) => updateFilters({ startDate: e.target.value })} />
          <Input aria-label="End date" type="date" value={filters.endDate} min={filters.startDate || undefined} onChange={(e) => updateFilters({ endDate: e.target.value })} />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-foreground font-medium mb-1">Couldn&apos;t load transactions</p>
            <p className="text-sm text-muted mb-4">{error}</p>
            <Button size="sm" variant="outline" onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}>Retry</Button>
          </div>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <RiExchangeDollarLine className="w-16 h-16 text-muted/20 mx-auto mb-4" />
            <p className="text-muted mb-2">{hasFilters ? 'No transactions match these filters' : 'No transactions yet'}</p>
            {!hasFilters && <Link href="/transactions/new" className="text-indigo-400 text-sm hover:text-indigo-300">Add your first transaction</Link>}
          </div>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted -mb-3">{data?.total} transaction{data?.total === 1 ? '' : 's'}</p>
          <Card className="divide-y divide-border p-0!">
            {transactions.map((tx, i) => (
              <motion.div key={tx._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between gap-3 p-4 hover:bg-surface-hover transition-colors group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <TransactionIcon type={tx.type} />
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
                <div className="flex items-center gap-3">
                  <TransactionAmount tx={tx} showTransferDetail />
                  <button
                    onClick={() => handleDelete(tx._id)}
                    disabled={deletingId === tx._id}
                    aria-label="Delete transaction"
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
                  >
                    <RiDeleteBinLine className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </Card>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" disabled={data.page <= 1} onClick={() => { setLoading(true); setFilters({ ...filters, page: data.page - 1 }); }}>Previous</Button>
              <span className="text-sm text-muted">Page {data.page} of {data.totalPages}</span>
              <Button variant="ghost" size="sm" disabled={data.page >= data.totalPages} onClick={() => { setLoading(true); setFilters({ ...filters, page: data.page + 1 }); }}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
