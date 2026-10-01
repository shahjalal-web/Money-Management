'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export interface TrendPoint {
  year: number;
  month: number;
  income: number;
  expense: number;
}

const W = 340;
const H = 190;
const PAD = { top: 12, right: 8, bottom: 24, left: 40 };
const BAR = 13; // <= 24px marks; two per month with a 2px surface gap
const GAP = 2;

const monthShort = (p: TrendPoint) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(p.year, p.month - 1, 1)));
const monthLong = (p: TrendPoint) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(p.year, p.month - 1, 1)));
const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

// "Nice" axis max so ticks land on round numbers
function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}

// Column with a 4px rounded data-end, square at the baseline
function columnPath(x: number, y: number, w: number, h: number) {
  if (h <= 0) return '';
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Income vs expense per month for one currency (grouped columns). */
export default function TrendChart({ data, currency, selected }: {
  data: TrendPoint[];
  currency: string;
  /** index of the month to emphasise (the dashboard's selected month) */
  selected?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const max = niceMax(Math.max(...data.map((d) => Math.max(d.income, d.expense)), 0));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const shown = active ?? null;
  const empty = data.every((d) => d.income === 0 && d.expense === 0);

  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-muted mb-2">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-viz-income" />Income</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-viz-expense" />Expense</span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label={`Income and expense by month in ${currency}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {compact(t)}
              </text>
            </g>
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--viz-axis)" strokeWidth={1} />

          {data.map((d, i) => {
            const cx = PAD.left + band * i + band / 2;
            const dim = shown !== null && shown !== i;
            return (
              <g key={`${d.year}-${d.month}`} opacity={dim ? 0.45 : 1}>
                <path d={columnPath(cx - BAR - GAP / 2, y(d.income), BAR, y(0) - y(d.income))} fill="var(--viz-income)" />
                <path d={columnPath(cx + GAP / 2, y(d.expense), BAR, y(0) - y(d.expense))} fill="var(--viz-expense)" />
                <text x={cx} y={H - 6} textAnchor="middle" fontSize={10} fill={i === selected ? 'var(--foreground)' : 'var(--muted)'} fontWeight={i === selected ? 600 : 400}>
                  {monthShort(d)}
                </text>
                {/* Whole month band is the tap/hover target, bigger than the bars */}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH + PAD.bottom}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${monthLong(d)}: income ${formatCurrency(d.income, currency)}, expense ${formatCurrency(d.expense, currency)}`}
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') setActive(i); }}
                  // Touch: tap a month to show it, tap it again to hide
                  onPointerDown={(e) => { if (e.pointerType !== 'mouse') setActive((a) => (a === i ? null : i)); }}
                  onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActive(null); }}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  style={{ outline: 'none', cursor: 'pointer' }}
                />
              </g>
            );
          })}
        </svg>

        {empty && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted pointer-events-none">
            No income or expense in these months
          </p>
        )}

        {shown !== null && (
          <div
            className="absolute top-0 z-10 pointer-events-none rounded-xl border border-border bg-surface shadow-lg px-3 py-2 text-xs min-w-[150px]"
            style={{
              left: `${((PAD.left + band * shown + band / 2) / W) * 100}%`,
              transform: `translateX(${shown < data.length / 2 ? '-10%' : '-90%'})`,
            }}
          >
            <p className="text-muted mb-1">{monthLong(data[shown])}</p>
            <TooltipRow color="var(--viz-income)" label="Income" value={formatCurrency(data[shown].income, currency)} />
            <TooltipRow color="var(--viz-expense)" label="Expense" value={formatCurrency(data[shown].expense, currency)} />
            <div className="border-t border-border mt-1 pt-1 flex justify-between gap-3">
              <span className="text-muted">Net</span>
              <span className="font-semibold text-foreground">{formatCurrency(data[shown].income - data[shown].expense, currency)}</span>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setShowTable((v) => !v)} className="mt-1 text-xs text-muted hover:text-foreground underline-offset-2 hover:underline">
        {showTable ? 'Hide table' : 'View as table'}
      </button>
      {showTable && (
        <table className="w-full mt-2 text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <thead>
            <tr className="text-muted text-left"><th className="font-medium py-1">Month</th><th className="font-medium text-right">Income</th><th className="font-medium text-right">Expense</th><th className="font-medium text-right">Net</th></tr>
          </thead>
          <tbody className="text-foreground">
            {data.map((d) => (
              <tr key={`${d.year}-${d.month}`} className="border-t border-border">
                <td className="py-1">{monthShort(d)} {d.year}</td>
                <td className="text-right">{formatCurrency(d.income, currency)}</td>
                <td className="text-right">{formatCurrency(d.expense, currency)}</td>
                <td className="text-right">{formatCurrency(d.income - d.expense, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-muted">
        <span className="w-3 h-0.5 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
