import { formatCurrency } from '@/lib/utils';

export interface CategoryTotal {
  name: string;
  total: number;
}

const MAX_ROWS = 5;

/**
 * Where the money went: one horizontal bar per expense category, largest first.
 * Single series, so no legend - the card title names it. Values sit at the bar tips.
 */
export default function CategoryBars({ rows, currency }: { rows: CategoryTotal[]; currency: string }) {
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  // Past five categories, fold the tail into "Other" rather than inventing more rows
  const shown = sorted.length > MAX_ROWS
    ? [...sorted.slice(0, MAX_ROWS - 1), { name: `Other (${sorted.length - MAX_ROWS + 1})`, total: sorted.slice(MAX_ROWS - 1).reduce((s, r) => s + r.total, 0) }]
    : sorted;
  const sum = sorted.reduce((s, r) => s + r.total, 0);
  const max = Math.max(...shown.map((r) => r.total), 0);

  if (shown.length === 0) {
    return <p className="text-sm text-muted py-6 text-center">No expenses in {currency} this month</p>;
  }

  return (
    <ul className="space-y-3">
      {shown.map((r) => (
        <li key={r.name}>
          <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
            <span className="text-foreground truncate">{r.name}</span>
            <span className="text-foreground font-semibold whitespace-nowrap">
              {formatCurrency(r.total, currency)}
              <span className="text-muted font-normal text-xs ml-1.5">{Math.round((r.total / sum) * 100)}%</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
            <div className="h-full rounded-r-[4px] bg-viz-expense" style={{ width: `${max ? (r.total / max) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
