import {
  RiArrowUpLine, RiArrowDownLine, RiExchangeDollarLine,
  RiHandCoinLine, RiHandHeartLine, RiRefund2Line, RiCoinsLine,
} from 'react-icons/ri';
import { cn, formatCurrency, getTransactionBgColor, getTransactionColor, transactionSign } from '@/lib/utils';
import type { Transaction } from '@/types';

const ICONS = {
  income: RiArrowUpLine,
  expense: RiArrowDownLine,
  transfer: RiExchangeDollarLine,
  lend: RiHandCoinLine,
  borrow: RiHandHeartLine,
  repay: RiRefund2Line,
  collect: RiCoinsLine,
};

export function TransactionIcon({ type, size = 'md' }: { type: Transaction['type']; size?: 'sm' | 'md' }) {
  const Icon = ICONS[type] || RiExchangeDollarLine;
  return (
    <div className={cn(
      'flex items-center justify-center flex-shrink-0',
      size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl',
      getTransactionBgColor(type),
    )}>
      <Icon className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5', getTransactionColor(type))} />
    </div>
  );
}

/** Signed amount: "+$300.00" for money in, "-৳1,500" for money out, plain for transfers */
export function TransactionAmount({ tx, showTransferDetail = false }: { tx: Transaction; showTransferDetail?: boolean }) {
  if (tx.type === 'transfer') {
    return (
      <div className="text-right">
        <p className={`font-semibold whitespace-nowrap ${getTransactionColor(tx.type)}`}>
          {formatCurrency(tx.fromAmount || 0, tx.fromCurrency)}
        </p>
        {showTransferDetail && (
          <p className="text-xs text-amber-500/60 whitespace-nowrap">
            → {formatCurrency(tx.toAmount || 0, tx.toCurrency)}
            {tx.fee ? ` · fee ${formatCurrency(tx.fee, tx.fromCurrency)}` : ''}
          </p>
        )}
      </div>
    );
  }
  const sign = transactionSign(tx.type);
  return (
    <p className={`font-semibold whitespace-nowrap text-right ${getTransactionColor(tx.type)}`}>
      {sign > 0 ? '+' : sign < 0 ? '-' : ''}{formatCurrency(tx.amount || 0, tx.currency)}
    </p>
  );
}
