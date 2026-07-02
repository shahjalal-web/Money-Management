'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiGet, apiPost } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import type { Account, IncomeSource, ExpenseCategory } from '@/types';
import toast from 'react-hot-toast';
import { RiArrowUpLine, RiArrowDownLine, RiArrowLeftRightLine } from 'react-icons/ri';

type Tab = 'income' | 'expense' | 'transfer';

export default function NewTransactionPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('income');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [incomeForm, setIncomeForm] = useState({ accountId: '', incomeSourceId: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [expenseForm, setExpenseForm] = useState({ accountId: '', expenseCategoryId: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', fromAmount: '', fee: '0', exchangeRate: '1', date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        const [acc, src, cat] = await Promise.all([apiGet<Account[]>('/accounts'), apiGet<IncomeSource[]>('/income-sources'), apiGet<ExpenseCategory[]>('/expense-categories')]);
        setAccounts(acc); setIncomeSources(src); setExpenseCategories(cat);
      } catch { /* handled */ } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const receivedAmount = useMemo(() => {
    const amount = parseFloat(transferForm.fromAmount) || 0;
    const fee = parseFloat(transferForm.fee) || 0;
    const rate = parseFloat(transferForm.exchangeRate) || 1;
    return (amount - fee) * rate;
  }, [transferForm.fromAmount, transferForm.fee, transferForm.exchangeRate]);

  const fromAccount = accounts.find(a => a._id === transferForm.fromAccountId);
  const toAccount = accounts.find(a => a._id === transferForm.toAccountId);

  async function handleIncomeSubmit(e: FormEvent) {
    e.preventDefault();
    if (!incomeForm.accountId || !incomeForm.incomeSourceId || !incomeForm.amount) { toast.error('Please fill in all required fields'); return; }
    setSaving(true);
    try { await apiPost('/transactions/income', { ...incomeForm, amount: parseFloat(incomeForm.amount) }); toast.success('Income recorded!'); router.push('/transactions'); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); } finally { setSaving(false); }
  }

  async function handleExpenseSubmit(e: FormEvent) {
    e.preventDefault();
    if (!expenseForm.accountId || !expenseForm.expenseCategoryId || !expenseForm.amount) { toast.error('Please fill in all required fields'); return; }
    setSaving(true);
    try { await apiPost('/transactions/expense', { ...expenseForm, amount: parseFloat(expenseForm.amount) }); toast.success('Expense recorded!'); router.push('/transactions'); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); } finally { setSaving(false); }
  }

  async function handleTransferSubmit(e: FormEvent) {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.fromAmount) { toast.error('Please fill in all required fields'); return; }
    if (transferForm.fromAccountId === transferForm.toAccountId) { toast.error('Cannot transfer to the same account'); return; }
    setSaving(true);
    try {
      await apiPost('/transactions/transfer', { fromAccountId: transferForm.fromAccountId, toAccountId: transferForm.toAccountId, fromAmount: parseFloat(transferForm.fromAmount), fee: parseFloat(transferForm.fee) || 0, exchangeRate: parseFloat(transferForm.exchangeRate) || 1, toAmount: receivedAmount, date: transferForm.date, notes: transferForm.notes });
      toast.success('Transfer recorded!'); router.push('/transactions');
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); } finally { setSaving(false); }
  }

  if (loading) return <div className="max-w-2xl mx-auto space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-[400px]" /></div>;

  const accountOptions = accounts.map(a => ({ value: a._id, label: `${a.name} (${a.currency})` }));
  const sourceOptions = incomeSources.map(s => ({ value: s._id, label: s.name }));
  const categoryOptions = expenseCategories.map(c => ({ value: c._id, label: c.name }));

  const tabs: { id: Tab; icon: typeof RiArrowUpLine; label: string; activeClass: string }[] = [
    { id: 'income', icon: RiArrowUpLine, label: 'Income', activeClass: 'bg-emerald-500/10 text-emerald-500' },
    { id: 'expense', icon: RiArrowDownLine, label: 'Expense', activeClass: 'bg-red-500/10 text-red-500' },
    { id: 'transfer', icon: RiArrowLeftRightLine, label: 'Transfer', activeClass: 'bg-amber-500/10 text-amber-500' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">New Transaction</h1>

      <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? t.activeClass : 'text-muted hover:text-foreground'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'income' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <Input label="Date" type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} />
              <Select label="Income Source" placeholder="Select source..." options={sourceOptions} value={incomeForm.incomeSourceId} onChange={(e) => setIncomeForm({ ...incomeForm, incomeSourceId: e.target.value })} />
              <Select label="To Account" placeholder="Select account..." options={accountOptions} value={incomeForm.accountId} onChange={(e) => setIncomeForm({ ...incomeForm, accountId: e.target.value })} />
              <Input label="Amount" type="number" step="0.01" placeholder="0.00" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} />
              <Input label="Notes (optional)" placeholder="Add a note..." value={incomeForm.notes} onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })} />
              <Button type="submit" className="w-full" loading={saving}>Record Income</Button>
            </form>
          </Card>
        </motion.div>
      )}

      {tab === 'expense' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <Input label="Date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
              <Select label="From Account" placeholder="Select account..." options={accountOptions} value={expenseForm.accountId} onChange={(e) => setExpenseForm({ ...expenseForm, accountId: e.target.value })} />
              <Select label="Expense Category" placeholder="Select category..." options={categoryOptions} value={expenseForm.expenseCategoryId} onChange={(e) => setExpenseForm({ ...expenseForm, expenseCategoryId: e.target.value })} />
              <Input label="Amount" type="number" step="0.01" placeholder="0.00" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              <Input label="Notes (optional)" placeholder="Add a note..." value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
              <Button type="submit" variant="danger" className="w-full" loading={saving}>Record Expense</Button>
            </form>
          </Card>
        </motion.div>
      )}

      {tab === 'transfer' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <Input label="Date" type="date" value={transferForm.date} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })} />
              <Select label="From Account" placeholder="Select source account..." options={accountOptions} value={transferForm.fromAccountId} onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })} />
              <Select label="To Account" placeholder="Select destination account..." options={accountOptions} value={transferForm.toAccountId} onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })} />
              <Input label={`Amount to Send${fromAccount ? ` (${fromAccount.currency})` : ''}`} type="number" step="0.01" placeholder="0.00" value={transferForm.fromAmount} onChange={(e) => setTransferForm({ ...transferForm, fromAmount: e.target.value })} />
              <Input label={`Transfer Fee${fromAccount ? ` (${fromAccount.currency})` : ''}`} type="number" step="0.01" placeholder="0.00" value={transferForm.fee} onChange={(e) => setTransferForm({ ...transferForm, fee: e.target.value })} />
              <Input label="Exchange Rate" type="number" step="0.0001" placeholder="1.0" value={transferForm.exchangeRate} onChange={(e) => setTransferForm({ ...transferForm, exchangeRate: e.target.value })} />
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-sm text-muted mb-1">Amount Received</p>
                <p className="text-2xl font-bold text-amber-500">{formatCurrency(receivedAmount, toAccount?.currency || 'BDT')}</p>
                <p className="text-xs text-muted mt-1">({transferForm.fromAmount || '0'} - {transferForm.fee || '0'}) x {transferForm.exchangeRate || '1'} = {receivedAmount.toFixed(2)}</p>
              </div>
              <Input label="Notes (optional)" placeholder="e.g., Payoneer to bKash withdrawal" value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} />
              <Button type="submit" variant="secondary" className="w-full" loading={saving}>Record Transfer</Button>
            </form>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
