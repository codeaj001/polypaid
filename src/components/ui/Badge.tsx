import { ReactNode } from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'blue' | 'good' | 'warn' | 'danger';
  className?: string;
  pulse?: boolean;
}

const tones = {
  neutral: 'bg-paper text-ink-soft border-line',
  blue: 'bg-blue-dim text-blue border-blue-mid',
  good: 'bg-good-dim text-good border-good/20',
  warn: 'bg-warn-dim text-warn border-warn/20',
  danger: 'bg-danger-dim text-danger border-danger/20',
};

export function Badge({ children, tone = 'neutral', className, pulse }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em]',
        tones[tone],
        className
      )}
    >
      {pulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {children}
    </span>
  );
}
