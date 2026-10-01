'use client';

import { Suspense, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiPost, errorMessage } from '@/lib/api';
import { useLookups } from '@/lib/useLookups';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import LoanForm, { type LoanAction } from '@/components/loans/LoanForm';
import { LOAN_ACTIONS } from '@/lib/constants';
import { formatCurrency, todayLocal } from '@/lib/utils';
import type { Account } from '@/types';
import toast from 'react-hot-toast';
import { RiArrowUpLine, RiArrowDownLine, RiArrowLeftRightLine, RiHandCoinLine } from 'react-icons/ri';

type Tab = 'income' | 'expense' | 'transfer' | 'loan';
const TABS: Tab[] = ['income', 'expense', 'transfer', 'loan'];

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-amber-500 bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">{children}</p>;
}

function balanceNote(account: Account) {
  return `Balance: ${formatCurrency(account.balance, account.currency)}`;
}

const LoadingSkeleton = () => <div className="max-w-2xl mx-auto space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-[400px]" /></div>;

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <NewTransactionForm />
    </Suspense>
  );
}

function NewTransactionForm() {
  const router = useRouter();
  // ?tab=loan&action=collect&loanId=... preselects a form (used by the Loans page)
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const actionParam = searchParams.get('action') as LoanAction | null;
  const [tab, setTab] = useState<Tab>(tabParam && TABS.includes(tabParam) ? tabParam : 'income');
  const { accounts, incomeSources, expenseCategories, loading, error, reload } = useLookups();
  const [saving, setSaving] = useState(false);

  const [incomeForm, setIncomeForm] = useState({ accountId: '', incomeSourceId: '', amount: '', date: todayLocal(), notes: '' });
  const [expenseForm, setExpenseForm] = useState({ accountId: '', expenseCategoryId: '', amount: '', date: todayLocal(), notes: '' });
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', fromAmount: '', fee: '0', exchangeRate: '1', date: todayLocal(), notes: '' });

  const incomeAccount = accounts.find(a => a._id === incomeForm.accountId);
  const expenseAccount = accounts.find(a => a._id === expenseForm.accountId);
  const fromAccount = accounts.find(a => a._id === transferForm.fromAccountId);
  const toAccount = accounts.find(a => a._id === transferForm.toAccountId);
  const sameCurrency = !!fromAccount && !!toAccount && fromAccount.currency === toAccount.currency;
  const effectiveRate = sameCurrency ? '1' : transferForm.exchangeRate;

  const receivedAmount = useMemo(() => {
    const amount = parseFloat(transferForm.fromAmount) || 0;
    const fee = parseFloat(transferForm.fee) || 0;
    const rate = parseFloat(effectiveRate) || 0;
    return Math.max(0, Math.round((amount - fee) * rate * 100) / 100);
  }, [transferForm.fromAmount, transferForm.fee, effectiveRate]);

  function positive(value: string) {
    const n = parseFloat(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  async function submit(path: string, body: object, successMsg: string) {
    setSaving(true);
    try {
      await apiPost(path, body);
      toast.success(successMsg);
      router.push('/transactions');
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save'));
      setSaving(false);
    }
  }

  function handleIncomeSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = positive(incomeForm.amount);
    if (!incomeForm.accountId || !incomeForm.incomeSourceId || !incomeForm.amount) { toast.error('Please fill in all required fields'); return; }
    if (!amount) { toast.error('Amount must be greater than 0'); return; }
    submit('/transactions/income', { ...incomeForm, amount }, 'Income recorded!');
  }

  function handleExpenseSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = positive(expenseForm.amount);
    if (!expenseForm.accountId || !expenseForm.expenseCategoryId || !expenseForm.amount) { toast.error('Please fill in all required fields'); return; }
    if (!amount) { toast.error('Amount must be greater than 0'); return; }
    submit('/transactions/expense', { ...expenseForm, amount }, 'Expense recorded!');
  }

  function handleTransferSubmit(e: FormEvent) {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.fromAmount) { toast.error('Please fill in all required fields'); return; }
    if (transferForm.fromAccountId === transferForm.toAccountId) { toast.error('Cannot transfer to the same account'); return; }
    const fromAmount = positive(transferForm.fromAmount);
    const rate = positive(effectiveRate);
    const fee = parseFloat(transferForm.fee) || 0;
    if (!fromAmount) { toast.error('Amount must be greater than 0'); return; }
    if (!rate) { toast.error('Exchange rate must be greater than 0'); return; }
    if (fee < 0 || fee >= fromAmount) { toast.error('Fee must be less than the amount sent'); return; }
    submit('/transactions/transfer', {
      fromAccountId: transferForm.fromAccountId,
      toAccountId: transferForm.toAccountId,
      fromAmount,
      fee,
      exchangeRate: rate,
      toAmount: receivedAmount,
      date: transferForm.date,
      notes: transferForm.notes,
    }, 'Transfer recorded!');
  }

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center py-10">
            <p className="text-foreground font-medium mb-1">Couldn&apos;t load your accounts</p>
            <p className="text-sm text-muted mb-4">{error}</p>
            <Button size="sm" variant="outline" onClick={reload}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  const accountOptions = accounts.map(a => ({ value: a._id, label: `${a.name} (${a.currency})` }));
  const sourceOptions = incomeSources.map(s => ({ value: s._id, label: s.name }));
  const categoryOptions = expenseCategories.map(c => ({ value: c._id, label: c.name }));

  const tabs: { id: Tab; icon: typeof RiArrowUpLine; label: string; activeClass: string }[] = [
    { id: 'income', icon: RiArrowUpLine, label: 'Income', activeClass: 'bg-emerald-500/10 text-emerald-500' },
    { id: 'expense', icon: RiArrowDownLine, label: 'Expense', activeClass: 'bg-red-500/10 text-red-500' },
    { id: 'transfer', icon: RiArrowLeftRightLine, label: 'Transfer', activeClass: 'bg-amber-500/10 text-amber-500' },
    { id: 'loan', icon: RiHandCoinLine, label: 'Loan', activeClass: 'bg-sky-500/10 text-sky-500' },
  ];

  const noAccounts = accounts.length === 0 && (
    <Hint>You need an account first. <Link href="/accounts" className="underline font-medium">Create one</Link>.</Hint>
  );

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
              {noAccounts}
              {incomeSources.length === 0 && <Hint>Add an income source (e.g. Upwork, Salary) in <Link href="/categories" className="underline font-medium">Categories</Link>.</Hint>}
              <Input label="Date" type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} />
              <Select label="Income Source" placeholder="Select source..." options={sourceOptions} value={incomeForm.incomeSourceId} onChange={(e) => setIncomeForm({ ...incomeForm, incomeSourceId: e.target.value })} />
              <Select label="To Account" placeholder="Select account..." options={accountOptions} value={incomeForm.accountId} onChange={(e) => setIncomeForm({ ...incomeForm, accountId: e.target.value })} />
              <Input label={`Amount${incomeAccount ? ` (${incomeAccount.currency})` : ''}`} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} />
              <Input label="Notes (optional)" placeholder="Add a note..." maxLength={500} value={incomeForm.notes} onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })} />
              <Button type="submit" className="w-full" loading={saving}>Record Income</Button>
            </form>
          </Card>
        </motion.div>
      )}

      {tab === 'expense' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              {noAccounts}
              {expenseCategories.length === 0 && <Hint>Add an expense category (e.g. Food, Rent) in <Link href="/categories" className="underline font-medium">Categories</Link>.</Hint>}
              <Input label="Date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
              <div>
                <Select label="From Account" placeholder="Select account..." options={accountOptions} value={expenseForm.accountId} onChange={(e) => setExpenseForm({ ...expenseForm, accountId: e.target.value })} />
                {expenseAccount && <p className="mt-1 text-xs text-muted">{balanceNote(expenseAccount)}</p>}
              </div>
              <Select label="Expense Category" placeholder="Select category..." options={categoryOptions} value={expenseForm.expenseCategoryId} onChange={(e) => setExpenseForm({ ...expenseForm, expenseCategoryId: e.target.value })} />
              <Input label={`Amount${expenseAccount ? ` (${expenseAccount.currency})` : ''}`} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              <Input label="Notes (optional)" placeholder="Add a note..." maxLength={500} value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
              <Button type="submit" variant="danger" className="w-full" loading={saving}>Record Expense</Button>
            </form>
          </Card>
        </motion.div>
      )}

      {tab === 'transfer' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {accounts.length < 2 && <Hint>Transfers need at least two accounts. <Link href="/accounts" className="underline font-medium">Add an account</Link>.</Hint>}
              <Input label="Date" type="date" value={transferForm.date} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })} />
              <div>
                <Select label="From Account" placeholder="Select source account..." options={accountOptions} value={transferForm.fromAccountId} onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })} />
                {fromAccount && <p className="mt-1 text-xs text-muted">{balanceNote(fromAccount)}</p>}
              </div>
              <Select label="To Account" placeholder="Select destination account..." options={accountOptions.filter(o => o.value !== transferForm.fromAccountId)} value={transferForm.toAccountId} onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })} />
              <Input label={`Amount to Send${fromAccount ? ` (${fromAccount.currency})` : ''}`} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={transferForm.fromAmount} onChange={(e) => setTransferForm({ ...transferForm, fromAmount: e.target.value })} />
              <Input label={`Transfer Fee${fromAccount ? ` (${fromAccount.currency})` : ''}`} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={transferForm.fee} onChange={(e) => setTransferForm({ ...transferForm, fee: e.target.value })} />
              <Input
                label={fromAccount && toAccount ? `Exchange Rate (1 ${fromAccount.currency} = ? ${toAccount.currency})` : 'Exchange Rate'}
                type="number" step="0.0001" min="0" inputMode="decimal" placeholder="1.0"
                value={effectiveRate}
                disabled={sameCurrency}
                onChange={(e) => setTransferForm({ ...transferForm, exchangeRate: e.target.value })}
              />
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-sm text-muted mb-1">Amount Received</p>
                <p className="text-2xl font-bold text-amber-500">{formatCurrency(receivedAmount, toAccount?.currency || 'BDT')}</p>
                <p className="text-xs text-muted mt-1">({transferForm.fromAmount || '0'} - {transferForm.fee || '0'}) x {effectiveRate || '0'} = {receivedAmount.toFixed(2)}</p>
              </div>
              <Input label="Notes (optional)" placeholder="e.g., Payoneer to bKash withdrawal" maxLength={500} value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} />
              <Button type="submit" variant="secondary" className="w-full" loading={saving}>Record Transfer</Button>
            </form>
          </Card>
        </motion.div>
      )}

      {tab === 'loan' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <LoanForm
              accounts={accounts}
              initialAction={actionParam && actionParam in LOAN_ACTIONS ? actionParam : 'lend'}
              initialLoanId={searchParams.get('loanId') || ''}
              initialPrevious={searchParams.get('previous') === '1'}
              onDone={() => router.push('/loans')}
            />
          </Card>
        </motion.div>
      )}
    </div>
  );
}
