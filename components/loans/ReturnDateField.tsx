'use client';

import Input from '@/components/ui/Input';
import type { ReturnDateType } from '@/types';

interface Props {
  date: string;
  type: ReturnDateType;
  onChange: (value: { date: string; type: ReturnDateType }) => void;
  min?: string;
}

// Optional return date plus whether it is only expected or a final (fixed) deadline
export default function ReturnDateField({ date, type, onChange, min }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        Return Date <span className="text-muted font-normal">(optional · ফেরতের তারিখ)</span>
      </label>
      <div className="flex gap-2">
        <Input aria-label="Return date" type="date" value={date} min={min} onChange={(e) => onChange({ date: e.target.value, type })} />
        <div className="flex p-1 bg-surface rounded-xl border border-border flex-shrink-0" role="radiogroup" aria-label="Return date type">
          {(['expected', 'final'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              disabled={!date}
              onClick={() => onChange({ date, type: t })}
              className={`px-3 rounded-lg text-sm font-medium capitalize transition-all disabled:opacity-40 ${
                type === t && date
                  ? t === 'final' ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-400'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">
        {!date ? 'Pick a date, then mark it Expected (approximate) or Final (fixed deadline).'
          : type === 'final' ? 'Final: the agreed deadline.' : 'Expected: an approximate date, may change.'}
      </p>
    </div>
  );
}
