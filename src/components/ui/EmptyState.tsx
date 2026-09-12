import { ReactNode } from 'react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('surface mx-auto max-w-xl px-8 py-12 text-center', className)}>
      {icon && (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-dim text-blue">
          {icon}
        </div>
      )}
      <h2 className="text-h3 text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-soft">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
