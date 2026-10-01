'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiDelete, apiGet, apiPut, errorMessage } from '@/lib/api';
import { formatCurrency, formatTxDate } from '@/lib/utils';
import { currencyName } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import ReturnDateField from '@/components/loans/ReturnDateField';
import ReturnDateBadge from '@/components/loans/ReturnDateBadge';
import type { Loan, LoanDetail, ReturnDateType } from '@/types';
import toast from 'react-hot-toast';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiHistoryLine, RiHandCoinLine, RiArrowDownSLine,
} from 'react-icons/ri';

type StatusFilter = 'open' | 'settled' | 'all';
type DirectionFilter = 'all' | 'given' | 'taken';

function toDateInput(date: string | null) {
  return date ? date.slice(0, 10) : '';
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<StatusFilter>('open');
  const [direction, setDirection] = useState<DirectionFilter>('all');
  const [editing, setEditing] = useState<Loan | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<Loan[]>('/loans')
      .then((data) => { if (active) { setLoans(data); setError(null); } })
      .catch((err: unknown) => { if (active) setError(errorMessage(err, 'Failed to load loans')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const visible = loans.filter((l) =>
    (status === 'all' || l.status === status) && (direction === 'all' || l.direction === direction));

  // Outstanding per currency over all open loans (not affected by the list filters)
  const totals = useMemo(() => {
    const map = new Map<string, { receivable: number; payable: number }>();
    for (const l of loans) {
      if (l.status !== 'open') continue;
      const row = map.get(l.currency) || { receivable: 0, payable: 0 };
      if (l.direction === 'given') row.receivable += l.outstanding;
      else row.payable += l.outstanding;
      map.set(l.currency, row);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [loans]);

  async function handleDelete(loan: Loan) {
    const msg = loan.isPrevious
      ? `Delete this previous loan with ${loan.person}? No account balance will change.`
      : `Delete this loan with ${loan.person}? The account balance change will be reversed.`;
    if (!confirm(msg)) return;
    try {
      await apiDelete(`/loans/${loan._id}`);
      toast.success('Loan deleted');
      reload();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to delete'));
    }
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-24" />{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loans</h1>
          <p className="text-sm text-muted">ধার দেয়া-নেয়া ও পরিশোধ</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/transactions/new?tab=loan&previous=1"><Button size="sm" variant="outline"><RiHistoryLine className="w-4 h-4" /> Previous Loan</Button></Link>
          <Link href="/transactions/new?tab=loan"><Button size="sm"><RiAddLine className="w-4 h-4" /> New Loan</Button></Link>
        </div>
      </div>

      {error ? (
        <Card>
          <div className="text-center py-10">
            <p className="text-foreground font-medium mb-1">Couldn&apos;t load loans</p>
            <p className="text-sm text-muted mb-4">{error}</p>
            <Button size="sm" variant="outline" onClick={() => { setLoading(true); reload(); }}>Retry</Button>
          </div>
        </Card>
      ) : (
        <>
          {totals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-sky-500/5! border-sky-500/20!">
                <p className="text-sm text-muted">To receive · পাবো</p>
                {totals.filter(([, t]) => t.receivable > 0).map(([c, t]) => (
                  <p key={c} className="text-xl font-bold text-sky-500">{formatCurrency(t.receivable, c)} <span className="text-xs font-normal text-muted">{currencyName(c)}</span></p>
                ))}
                {!totals.some(([, t]) => t.receivable > 0) && <p className="text-xl font-bold text-muted">0</p>}
              </Card>
              <Card className="bg-violet-500/5! border-violet-500/20!">
                <p className="text-sm text-muted">To pay · দেবো</p>
                {totals.filter(([, t]) => t.payable > 0).map(([c, t]) => (
                  <p key={c} className="text-xl font-bold text-violet-500">{formatCurrency(t.payable, c)} <span className="text-xs font-normal text-muted">{currencyName(c)}</span></p>
                ))}
                {!totals.some(([, t]) => t.payable > 0) && <p className="text-xl font-bold text-muted">0</p>}
              </Card>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border">
              {(['open', 'settled', 'all'] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${status === s ? 'bg-indigo-500/10 text-indigo-400' : 'text-muted hover:text-foreground'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border">
              {([['all', 'All'], ['given', 'I lent · দিয়েছি'], ['taken', 'I borrowed · নিয়েছি']] as const).map(([d, label]) => (
                <button key={d} onClick={() => setDirection(d)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${direction === d ? 'bg-indigo-500/10 text-indigo-400' : 'text-muted hover:text-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <RiHandCoinLine className="w-16 h-16 text-muted/20 mx-auto mb-4" />
                <p className="text-muted mb-2">{loans.length === 0 ? 'No loans yet' : 'No loans match these filters'}</p>
                {loans.length === 0 && <Link href="/transactions/new?tab=loan" className="text-indigo-400 text-sm hover:text-indigo-300">Record a loan (ধার দেয়া / নেয়া)</Link>}
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {visible.map((loan, i) => (
                <motion.div key={loan._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <LoanCard
                    loan={loan}
                    showHistory={historyFor === loan._id}
                    onToggleHistory={() => setHistoryFor(historyFor === loan._id ? null : loan._id)}
                    onEdit={() => setEditing(loan)}
                    onDelete={() => handleDelete(loan)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit loan · ${editing?.person || ''}`}>
        {editing && <EditLoanForm key={editing._id} loan={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      </Modal>
    </div>
  );
}

function LoanCard({ loan, showHistory, onToggleHistory, onEdit, onDelete }: {
  loan: Loan;
  showHistory: boolean;
  onToggleHistory: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const given = loan.direction === 'given';
  const paidPct = Math.min(100, Math.round((loan.repaidAmount / loan.principal) * 100));
  const action = given ? 'collect' : 'repay';

  return (
    <Card className="p-4!">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate">{loan.person}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${given ? 'bg-sky-500/10 text-sky-500' : 'bg-violet-500/10 text-violet-500'}`}>
              {given ? 'I lent · ধার দিয়েছি' : 'I borrowed · ধার নিয়েছি'}
            </span>
            {loan.isPrevious && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-500">Previous · আগের হিসাব</span>}
            {loan.status === 'settled' && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-500">Settled</span>}
          </div>
          <p className="text-xs text-muted mt-1">
            {formatTxDate(loan.date)} · {formatCurrency(loan.principal, loan.currency)}{loan.notes ? ` · ${loan.notes}` : ''}
          </p>
          <div className="mt-1"><ReturnDateBadge loan={loan} /></div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{loan.status === 'open' ? (given ? 'To receive' : 'To pay') : 'Paid'}</p>
          <p className={`text-xl font-bold ${loan.status === 'settled' ? 'text-emerald-500' : given ? 'text-sky-500' : 'text-violet-500'}`}>
            {formatCurrency(loan.status === 'open' ? loan.outstanding : loan.principal, loan.currency)}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
        </div>
        <p className="text-xs text-muted mt-1">
          {formatCurrency(loan.repaidAmount, loan.currency)} paid back ({paidPct}%)
          {!!loan.initialRepaid && ` · ${formatCurrency(loan.initialRepaid, loan.currency)} before using the app`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {loan.status === 'open' && (
          <Link href={`/transactions/new?tab=loan&action=${action}&loanId=${loan._id}`}>
            <Button size="sm" variant="outline">{given ? 'Collect · পরিশোধ পাওয়া' : 'Repay · পরিশোধ করা'}</Button>
          </Link>
        )}
        <button onClick={onToggleHistory} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
          <RiHistoryLine className="w-4 h-4" /> History <RiArrowDownSLine className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={onEdit} aria-label="Edit loan" className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
          <RiEditLine className="w-4 h-4" />
        </button>
        {/* Deletable only while no repayment has been recorded in the app */}
        {loan.repaidAmount === (loan.initialRepaid || 0) && (
          <button onClick={onDelete} aria-label="Delete loan" className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <RiDeleteBinLine className="w-4 h-4" />
          </button>
        )}
      </div>

      {showHistory && <LoanHistory loanId={loan._id} />}
    </Card>
  );
}

function LoanHistory({ loanId }: { loanId: string }) {
  const [detail, setDetail] = useState<LoanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<LoanDetail>(`/loans/${loanId}`)
      .then((d) => { if (active) setDetail(d); })
      .catch((err: unknown) => { if (active) setError(errorMessage(err, 'Failed to load history')); });
    return () => { active = false; };
  }, [loanId]);

  if (error) return <p className="text-sm text-red-400 mt-3">{error}</p>;
  if (!detail) return <Skeleton className="h-16 mt-3" />;

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      {detail.transactions.map((tx) => (
        <div key={tx._id} className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Badge type={tx.type} />
            <span className="text-muted">{formatTxDate(tx.date)}</span>
            {tx.notes && <span className="text-muted truncate">· {tx.notes}</span>}
          </div>
          <span className="font-medium text-foreground whitespace-nowrap">{formatCurrency(tx.amount || 0, tx.currency)}</span>
        </div>
      ))}
      {detail.transactions.length === 0 && <p className="text-sm text-muted">No repayments recorded yet.</p>}
      {detail.isPrevious && (
        <p className="text-xs text-muted">
          Previous loan from {formatTxDate(detail.date)}: {formatCurrency(detail.principal, detail.currency)}
          {detail.initialRepaid ? `, ${formatCurrency(detail.initialRepaid, detail.currency)} already returned before` : ''} (no account changed).
        </p>
      )}
      <p className="text-xs text-muted">To delete a repayment, delete it from Transactions.</p>
    </div>
  );
}

function EditLoanForm({ loan, onClose, onSaved }: { loan: Loan; onClose: () => void; onSaved: () => void }) {
  const [person, setPerson] = useState(loan.person);
  const [notes, setNotes] = useState(loan.notes || '');
  const [ret, setRet] = useState<{ date: string; type: ReturnDateType }>({
    date: toDateInput(loan.returnDate),
    type: loan.returnDateType || 'expected',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!person.trim()) { toast.error('Person name is required'); return; }
    setSaving(true);
    try {
      await apiPut(`/loans/${loan._id}`, {
        person: person.trim(),
        notes,
        returnDate: ret.date || null,
        returnDateType: ret.date ? ret.type : null,
      });
      toast.success('Loan updated');
      onSaved();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save'));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label={loan.direction === 'given' ? 'Lent to' : 'Borrowed from'} maxLength={100} value={person} onChange={(e) => setPerson(e.target.value)} />
      <ReturnDateField date={ret.date} type={ret.type} min={toDateInput(loan.date)} onChange={setRet} />
      {ret.date && (
        <button type="button" onClick={() => setRet({ ...ret, date: '' })} className="text-xs text-muted hover:text-foreground -mt-2">
          Remove return date
        </button>
      )}
      <Input label="Notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={saving} className="flex-1">Save</Button>
      </div>
    </form>
  );
}
