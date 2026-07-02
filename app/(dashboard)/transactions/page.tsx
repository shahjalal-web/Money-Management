'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiGet, apiDelete } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency, formatDate, getTransactionColor, getTransactionBgColor } from '@/lib/utils';
import type { Transaction, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';
import { RiArrowUpLine, RiArrowDownLine, RiExchangeDollarLine, RiDeleteBinLine, RiAddLine, RiFilterLine } from 'react-icons/ri';

export default function TransactionsPage() {
  const [data, setData] = useState<PaginatedResponse<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '', page: '1' });

  async function fetchTransactions() {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      params.set('page', filters.page);
      params.set('limit', '15');
      setData(await apiGet<PaginatedResponse<Transaction>>(`/transactions?${params.toString()}`));
    } catch { /* handled */ } finally { setLoading(false); }
  }

  useEffect(() => { fetchTransactions(); }, [filters]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction? This will reverse the balance change.')) return;
    try { await apiDelete(`/transactions/${id}`); toast.success('Transaction deleted'); fetchTransactions(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <Link href="/transactions/new"><Button size="sm"><RiAddLine className="w-4 h-4" /> New</Button></Link>
      </div>

      <Card className="p-4!">
        <div className="flex items-center gap-2 mb-3">
          <RiFilterLine className="w-4 h-4 text-muted" />
          <span className="text-sm text-muted">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select placeholder="All types" options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }, { value: 'transfer', label: 'Transfer' }]} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: '1' })} />
          <Input type="date" placeholder="Start date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: '1' })} />
          <Input type="date" placeholder="End date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: '1' })} />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : transactions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <RiExchangeDollarLine className="w-16 h-16 text-muted/20 mx-auto mb-4" />
            <p className="text-muted mb-2">No transactions found</p>
            <Link href="/transactions/new" className="text-indigo-400 text-sm hover:text-indigo-300">Add your first transaction</Link>
          </div>
        </Card>
      ) : (
        <>
          <Card className="divide-y divide-border p-0!">
            {transactions.map((tx, i) => (
              <motion.div key={tx._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTransactionBgColor(tx.type)}`}>
                    {tx.type === 'income' ? <RiArrowUpLine className={`w-5 h-5 ${getTransactionColor(tx.type)}`} /> :
                     tx.type === 'expense' ? <RiArrowDownLine className={`w-5 h-5 ${getTransactionColor(tx.type)}`} /> :
                     <RiExchangeDollarLine className={`w-5 h-5 ${getTransactionColor(tx.type)}`} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge type={tx.type} />
                      {tx.notes && <span className="text-sm text-muted truncate">{tx.notes}</span>}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                      {tx.type === 'income' && '+'}{tx.type === 'expense' && '-'}
                      {tx.type === 'transfer' ? formatCurrency(tx.fromAmount || 0, tx.fromCurrency) : formatCurrency(tx.amount || 0, tx.currency)}
                    </p>
                    {tx.type === 'transfer' && <p className="text-xs text-amber-500/60">→ {formatCurrency(tx.toAmount || 0, tx.toCurrency)}</p>}
                  </div>
                  <button onClick={() => handleDelete(tx._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <RiDeleteBinLine className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </Card>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" disabled={data.page <= 1} onClick={() => setFilters({ ...filters, page: String(data.page - 1) })}>Previous</Button>
              <span className="text-sm text-muted">Page {data.page} of {data.totalPages}</span>
              <Button variant="ghost" size="sm" disabled={data.page >= data.totalPages} onClick={() => setFilters({ ...filters, page: String(data.page + 1) })}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
