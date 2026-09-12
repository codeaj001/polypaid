import { ReactNode } from 'react';
import clsx from 'clsx';

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <h1 className="text-h1 text-ink">{title}</h1>
        {description && <p className="mt-2 text-[15px] text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section className={clsx(className)}>
      {(title || description) && (
        <div className="mb-8">
          {title && <h2 className="text-h2 text-ink">{title}</h2>}
          {description && <p className="mt-2 max-w-xl text-[15px] text-ink-soft">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
