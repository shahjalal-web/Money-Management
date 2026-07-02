import { cn, getTransactionColor, getTransactionBgColor } from '@/lib/utils';

interface BadgeProps {
  type: string;
  className?: string;
}

export default function Badge({ type, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        getTransactionBgColor(type),
        getTransactionColor(type),
        className
      )}
    >
      {type}
    </span>
  );
}
