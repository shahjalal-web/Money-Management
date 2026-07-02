import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-surface border border-border p-6',
        hover && 'transition-all duration-300 hover:bg-surface-hover hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}
