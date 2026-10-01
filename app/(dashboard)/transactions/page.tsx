'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiDelete, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/useApi';
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

const PAGE_SIZE = 20;
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

const ListSkeleton = () => <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

export default function TransactionsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <TransactionsList />
    </Suspense>
  );
}

// Consecutive rows sharing a date, so the list reads as a day-by-day statement
function groupByDay(transactions: Transaction[]) {
  const groups: { day: string; items: Transaction[] }[] = [];
  for (const tx of transactions) {
    const day = formatTxDate(tx.date);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(tx);
    else groups.push({ day, items: [tx] });
  }
  return groups;
}

function TransactionsList() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => ({ ...EMPTY_FILTERS, accountId: searchParams.get('accountId') || '' }));
  const [showFilters, setShowFilters] = useState(() => !!searchParams.get('accountId'));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { accounts, describe } = useLookups();

  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.accountId) params.set('accountId', filters.accountId);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  params.set('page', String(filters.page));
  params.set('limit', String(PAGE_SIZE));
  const { data, loading, error, refreshing, reload } = useApi<PaginatedResponse<Transaction>>(`/transactions?${params.toString()}`);

  function updateFilters(patch: Partial<typeof EMPTY_FILTERS>) {
    setFilters((f) => ({ ...f, page: 1, ...patch }));
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction? This will reverse the balance change.')) return;
    setDeletingId(id);
    try {
      await apiDelete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      // The list refreshes itself after any write; step back if this page is now empty
      if (data && data.transactions.length === 1 && filters.page > 1) {
        setFilters((f) => ({ ...f, page: f.page - 1 }));
      }
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to delete'));
    } finally {
      setDeletingId(null);
    }
  }

  const transactions = data?.transactions || [];
  const activeFilterCount = [filters.type, filters.accountId, filters.startDate, filters.endDate].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${showFilters || activeFilterCount ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 'border-border text-muted hover:text-foreground'}`}
          >
            <RiFilterLine className="w-4 h-4" />
            Filter{activeFilterCount ? ` · ${activeFilterCount}` : ''}
          </button>
          <Link href="/transactions/new"><Button size="sm"><RiAddLine className="w-4 h-4" /> New</Button></Link>
        </div>
      </div>

      {showFilters && (
        <Card className="p-3!">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Select aria-label="Type" placeholder="All types" options={TYPE_OPTIONS} value={filters.type} onChange={(e) => updateFilters({ type: e.target.value })} />
            <Select aria-label="Account" placeholder="All accounts" options={accounts.map((a) => ({ value: a._id, label: `${a.name} (${a.currency})` }))} value={filters.accountId} onChange={(e) => updateFilters({ accountId: e.target.value })} />
            <Input aria-label="Start date" type="date" value={filters.startDate} max={filters.endDate || undefined} onChange={(e) => updateFilters({ startDate: e.target.value })} />
            <Input aria-label="End date" type="date" value={filters.endDate} min={filters.startDate || undefined} onChange={(e) => updateFilters({ endDate: e.target.value })} />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => updateFilters(EMPTY_FILTERS)} className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors">
              <RiCloseLine className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </Card>
      )}

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-foreground font-medium mb-1">Couldn&apos;t load transactions</p>
            <p className="text-sm text-muted mb-4">{error}</p>
            <Button size="sm" variant="outline" onClick={reload}>Retry</Button>
          </div>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <RiExchangeDollarLine className="w-16 h-16 text-muted/20 mx-auto mb-4" />
            <p className="text-muted mb-2">{activeFilterCount ? 'No transactions match these filters' : 'No transactions yet'}</p>
            {!activeFilterCount && <Link href="/transactions/new" className="text-indigo-400 text-sm hover:text-indigo-300">Add your first transaction</Link>}
          </div>
        </Card>
      ) : (
        // Keep the old list visible (dimmed) while a filter/page change loads
        <div className={`space-y-4 transition-opacity ${refreshing ? 'opacity-70' : ''}`}>
          <p className="text-xs text-muted">{data?.total} transaction{data?.total === 1 ? '' : 's'}</p>
          {groupByDay(transactions).map((group) => (
            <section key={group.day}>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 px-1">{group.day}</h2>
              <Card className="divide-y divide-border p-0! overflow-hidden">
                {group.items.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4 hover:bg-surface-hover transition-colors group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <TransactionIcon type={tx.type} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{describe(tx)}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <Badge type={tx.type} />
                          {tx.notes && <span className="text-xs text-muted truncate">{tx.notes}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-3">
                      <TransactionAmount tx={tx} showTransferDetail />
                      <button
                        onClick={() => handleDelete(tx._id)}
                        disabled={deletingId === tx._id}
                        aria-label="Delete transaction"
                        className="p-2 -mr-1 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
                      >
                        <RiDeleteBinLine className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          ))}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" disabled={data.page <= 1} onClick={() => setFilters({ ...filters, page: data.page - 1 })}>Previous</Button>
              <span className="text-sm text-muted">Page {data.page} of {data.totalPages}</span>
              <Button variant="ghost" size="sm" disabled={data.page >= data.totalPages} onClick={() => setFilters({ ...filters, page: data.page + 1 })}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
