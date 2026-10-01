import { daysUntil, formatTxDate } from '@/lib/utils';
import type { Loan } from '@/types';

// "Oct 15, 2026 · Final · in 14 days" — red when overdue, amber when within a week
export default function ReturnDateBadge({ loan }: { loan: Pick<Loan, 'returnDate' | 'returnDateType' | 'status'> }) {
  if (!loan.returnDate) return <span className="text-xs text-muted">No return date</span>;

  const days = daysUntil(loan.returnDate);
  const open = loan.status === 'open';
  const relative = !open ? null
    : days < 0 ? `${-days} day${days === -1 ? '' : 's'} overdue`
    : days === 0 ? 'due today'
    : `in ${days} day${days === 1 ? '' : 's'}`;
  const tone = !open ? 'text-muted'
    : days < 0 ? 'text-red-500'
    : days <= 7 ? 'text-amber-500'
    : 'text-muted';

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 text-xs ${tone}`}>
      <span>{formatTxDate(loan.returnDate)}</span>
      <span className={`px-1.5 py-0.5 rounded-md font-medium capitalize ${
        loan.returnDateType === 'final' ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-400'
      }`}>
        {loan.returnDateType || 'expected'}
      </span>
      {relative && <span className="font-medium">{relative}</span>}
    </span>
  );
}
