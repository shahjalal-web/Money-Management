'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { apiGet, apiPost, errorMessage } from '@/lib/api';
import { CURRENCIES, LOAN_ACTIONS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatTxDate, todayLocal } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ReturnDateField from './ReturnDateField';
import ReturnDateBadge from './ReturnDateBadge';
import type { Account, Loan, LoanTransactionType, ReturnDateType } from '@/types';
import toast from 'react-hot-toast';

export type LoanAction = LoanTransactionType;

interface Props {
  accounts: Account[];
  initialAction?: LoanAction;
  initialLoanId?: string;
  /** Start in "previous loan" mode (old pawna/dena entered for record only) */
  initialPrevious?: boolean;
  onDone: () => void;
}

const ACTION_STYLES: Record<LoanAction, string> = {
  lend: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
  borrow: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
  repay: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  collect: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
};

function positive(value: string) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function LoanForm({ accounts, initialAction = 'lend', initialLoanId = '', initialPrevious = false, onDone }: Props) {
  const { profile } = useAuth();
  const [action, setAction] = useState<LoanAction>(initialAction);
  // Previous loans move no money now: no account, just a currency and what's already been returned
  const [previous, setPrevious] = useState(initialPrevious);
  const [openLoans, setOpenLoans] = useState<Loan[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // lend / borrow
  const [newLoan, setNewLoan] = useState({
    person: '', accountId: '', amount: '', date: todayLocal(), notes: '',
    returnDate: '', returnDateType: 'expected' as ReturnDateType,
    currency: profile?.defaultCurrency || 'BDT', alreadyRepaid: '',
  });
  // repay / collect
  const [payment, setPayment] = useState({ loanId: initialLoanId, accountId: '', amount: '', date: todayLocal(), notes: '' });

  useEffect(() => {
    let active = true;
    apiGet<Loan[]>('/loans')
      .then((loans) => {
        if (!active) return;
        setOpenLoans(loans.filter((l) => l.status === 'open'));
        setPeople([...new Set(loans.map((l) => l.person))].sort((a, b) => a.localeCompare(b)));
        // Prefill amount/account when arriving with a specific loan (from the Loans page)
        const pre = loans.find((l) => l._id === initialLoanId && l.status === 'open');
        if (pre) {
          setPayment((p) => ({
            ...p,
            amount: String(pre.outstanding),
            accountId: pre.accountId && accounts.some((a) => a._id === pre.accountId) ? pre.accountId : '',
          }));
        }
      })
      .catch((err: unknown) => { if (active) toast.error(errorMessage(err, 'Failed to load loans')); });
    return () => { active = false; };
  }, [initialLoanId, accounts]);

  const isNew = action === 'lend' || action === 'borrow';
  // repay settles money I borrowed (taken); collect settles money I lent (given)
  const candidateLoans = openLoans.filter((l) => l.direction === (action === 'repay' ? 'taken' : 'given'));
  const selectedLoan = candidateLoans.find((l) => l._id === payment.loanId);
  const paymentAccounts = selectedLoan ? accounts.filter((a) => a.currency === selectedLoan.currency) : [];
  const newAccount = accounts.find((a) => a._id === newLoan.accountId);
  const paymentAccount = accounts.find((a) => a._id === payment.accountId);

  function chooseLoan(loanId: string) {
    const loan = candidateLoans.find((l) => l._id === loanId);
    const keepAccount = loan && accounts.some((a) => a._id === payment.accountId && a.currency === loan.currency);
    // Previous loans have no account; then the user picks one
    const defaultAccount = loan?.accountId && accounts.some((a) => a._id === loan.accountId) ? loan.accountId : '';
    setPayment({
      ...payment,
      loanId,
      amount: loan ? String(loan.outstanding) : '',
      accountId: keepAccount ? payment.accountId : defaultAccount,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const amount = positive(newLoan.amount);
        if (!newLoan.person.trim()) throw new Error('Please enter the person\'s name');
        if (!previous && !newLoan.accountId) throw new Error('Please choose an account');
        if (!amount) throw new Error('Amount must be greater than 0');
        const alreadyRepaid = parseFloat(newLoan.alreadyRepaid) || 0;
        if (previous && (alreadyRepaid < 0 || alreadyRepaid >= amount)) {
          throw new Error('Already paid back must be less than the loan amount');
        }
        await apiPost('/loans', {
          direction: action === 'lend' ? 'given' : 'taken',
          person: newLoan.person.trim(),
          ...(previous
            ? { previous: true, currency: newLoan.currency, alreadyRepaid }
            : { accountId: newLoan.accountId }),
          amount,
          date: newLoan.date,
          returnDate: newLoan.returnDate || null,
          returnDateType: newLoan.returnDate ? newLoan.returnDateType : null,
          notes: newLoan.notes,
        });
        toast.success(previous
          ? `Previous loan with ${newLoan.person.trim()} saved (no account changed)`
          : action === 'lend' ? `Lent to ${newLoan.person.trim()}` : `Borrowed from ${newLoan.person.trim()}`);
      } else {
        const amount = positive(payment.amount);
        if (!selectedLoan || !payment.accountId) throw new Error('Please choose the loan and account');
        if (!amount) throw new Error('Amount must be greater than 0');
        if (amount > selectedLoan.outstanding + 0.005) {
          throw new Error(`Only ${formatCurrency(selectedLoan.outstanding, selectedLoan.currency)} is outstanding`);
        }
        await apiPost(`/loans/${selectedLoan._id}/repayments`, {
          accountId: payment.accountId, amount, date: payment.date, notes: payment.notes,
        });
        toast.success(action === 'repay' ? `Repaid ${selectedLoan.person}` : `Collected from ${selectedLoan.person}`);
      }
      onDone();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save'));
      setSaving(false);
    }
  }

  const accountOptions = (list: Account[]) => list.map((a) => ({ value: a._id, label: `${a.name} (${a.currency})` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(LOAN_ACTIONS) as LoanAction[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setAction(key)}
            className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
              action === key ? ACTION_STYLES[key] : 'border-border text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            <span className="block text-sm font-semibold">{LOAN_ACTIONS[key].bn}</span>
            <span className="block text-xs opacity-80">{LOAN_ACTIONS[key].label} · {LOAN_ACTIONS[key].hint}</span>
          </button>
        ))}
      </div>

      {isNew && (
        <div>
          <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border" role="radiogroup" aria-label="Loan timing">
            {([[false, 'New · এখন'], [true, 'Previous · আগের হিসাব']] as const).map(([value, label]) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={previous === value}
                onClick={() => setPrevious(value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${previous === value ? 'bg-indigo-500/10 text-indigo-400' : 'text-muted hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">
            {previous
              ? 'For old loans from before you used the app. No account balance will change.'
              : action === 'lend' ? 'Money leaves the chosen account now.' : 'Money arrives in the chosen account now.'}
          </p>
        </div>
      )}

      {accounts.length === 0 && !(isNew && previous) && (
        <p className="text-sm text-amber-500 bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">
          You need an account first. <Link href="/accounts" className="underline font-medium">Create one</Link>.
        </p>
      )}

      {isNew ? (
        <>
          <div>
            <Input
              label={action === 'lend' ? 'Lent to (কাকে দিলাম)' : 'Borrowed from (কার থেকে নিলাম)'}
              placeholder="Person's name"
              list="loan-people"
              maxLength={100}
              value={newLoan.person}
              onChange={(e) => setNewLoan({ ...newLoan, person: e.target.value })}
            />
            <datalist id="loan-people">
              {people.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>
          {previous ? (
            <Select
              label="Currency"
              value={newLoan.currency}
              options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
              onChange={(e) => setNewLoan({ ...newLoan, currency: e.target.value })}
            />
          ) : (
            <Select
              label={action === 'lend' ? 'Paid from account' : 'Received into account'}
              placeholder="Select account..."
              options={accountOptions(accounts)}
              value={newLoan.accountId}
              onChange={(e) => setNewLoan({ ...newLoan, accountId: e.target.value })}
            />
          )}
          <Input label={previous ? `Total loan amount (${newLoan.currency})` : `Amount${newAccount ? ` (${newAccount.currency})` : ''}`} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={newLoan.amount} onChange={(e) => setNewLoan({ ...newLoan, amount: e.target.value })} />
          {previous && (
            <div>
              <Input
                label={`Already paid back (optional · আগে যা ফেরত ${action === 'lend' ? 'পেয়েছি' : 'দিয়েছি'})`}
                type="number" step="0.01" min="0" inputMode="decimal" placeholder="0"
                value={newLoan.alreadyRepaid}
                onChange={(e) => setNewLoan({ ...newLoan, alreadyRepaid: e.target.value })}
              />
              {positive(newLoan.amount) && (
                <p className="mt-1 text-xs text-muted">
                  Still {action === 'lend' ? 'to receive' : 'to pay'}:{' '}
                  {formatCurrency(Math.max(0, (positive(newLoan.amount) || 0) - (parseFloat(newLoan.alreadyRepaid) || 0)), newLoan.currency)}
                </p>
              )}
            </div>
          )}
          <Input label={previous ? 'Loan date (approx. is fine)' : 'Date'} type="date" value={newLoan.date} onChange={(e) => setNewLoan({ ...newLoan, date: e.target.value })} />
          <ReturnDateField
            date={newLoan.returnDate}
            type={newLoan.returnDateType}
            min={newLoan.date}
            onChange={({ date, type }) => setNewLoan({ ...newLoan, returnDate: date, returnDateType: type })}
          />
          <Input label="Notes (optional)" placeholder="e.g., for house rent" maxLength={500} value={newLoan.notes} onChange={(e) => setNewLoan({ ...newLoan, notes: e.target.value })} />
        </>
      ) : candidateLoans.length === 0 ? (
        <p className="text-sm text-muted bg-surface-hover rounded-xl px-4 py-6 text-center">
          {action === 'repay'
            ? 'No open loans you borrowed. Record one with ধার নেয়া first.'
            : 'No open loans you gave. Record one with ধার দেয়া first.'}
        </p>
      ) : (
        <>
          <Select
            label={action === 'repay' ? 'Which loan are you repaying? (কাকে পরিশোধ)' : 'Which loan is being paid back? (কার থেকে পেলাম)'}
            placeholder="Select loan..."
            options={candidateLoans.map((l) => ({
              value: l._id,
              label: `${l.person} — ${formatCurrency(l.outstanding, l.currency)} due (from ${formatTxDate(l.date)})`,
            }))}
            value={payment.loanId}
            onChange={(e) => chooseLoan(e.target.value)}
          />
          {selectedLoan && (
            <div className="p-3 rounded-xl bg-surface-hover text-sm space-y-1">
              <p className="text-foreground">
                {formatCurrency(selectedLoan.repaidAmount, selectedLoan.currency)} of {formatCurrency(selectedLoan.principal, selectedLoan.currency)} paid ·{' '}
                <span className="font-semibold">{formatCurrency(selectedLoan.outstanding, selectedLoan.currency)} left</span>
              </p>
              <ReturnDateBadge loan={selectedLoan} />
            </div>
          )}
          <Select
            label={action === 'repay' ? 'Paid from account' : 'Received into account'}
            placeholder={selectedLoan ? `Select ${selectedLoan.currency} account...` : 'Choose a loan first'}
            options={accountOptions(paymentAccounts)}
            value={payment.accountId}
            disabled={!selectedLoan}
            onChange={(e) => setPayment({ ...payment, accountId: e.target.value })}
          />
          {selectedLoan && paymentAccounts.length === 0 && (
            <p className="text-xs text-amber-500 -mt-2">No {selectedLoan.currency} account found. Create one in Accounts.</p>
          )}
          <Input label={`Amount${paymentAccount ? ` (${paymentAccount.currency})` : ''}`} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
          <Input label="Date" type="date" value={payment.date} onChange={(e) => setPayment({ ...payment, date: e.target.value })} />
          <Input label="Notes (optional)" placeholder="Add a note..." maxLength={500} value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} />
        </>
      )}

      <Button type="submit" className="w-full" loading={saving} disabled={!isNew && candidateLoans.length === 0}>
        Record {isNew && previous ? 'Previous ' : ''}{LOAN_ACTIONS[action].label} ({LOAN_ACTIONS[action].bn})
      </Button>
    </form>
  );
}
