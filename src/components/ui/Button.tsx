import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ink';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  to?: string;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-blue text-white shadow-soft hover:brightness-110 active:brightness-95 disabled:bg-blue/50',
  secondary:
    'bg-surface text-ink border border-line hover:bg-paper hover:border-line-strong active:bg-paper/80',
  ghost: 'bg-transparent text-ink-soft hover:bg-black/[0.04] hover:text-ink',
  danger: 'bg-danger-dim text-danger hover:bg-danger/15',
  ink: 'bg-ink text-white hover:bg-blue active:brightness-95',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-xl',
  md: 'h-11 px-5 text-[14px] rounded-xl',
  lg: 'h-12 px-6 text-[15px] rounded-xl',
};

function classes(variant: Variant, size: Size, fullWidth?: boolean, className?: string) {
  return clsx(
    'inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-[transform,background-color,color,box-shadow,border-color,filter] duration-200 ease-apple',
    'focus-visible:outline-none focus-visible:shadow-focus',
    'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', fullWidth, disabled, type = 'button', children, to, ...props },
  ref
) {
  const classNames = classes(variant, size, fullWidth, className);

  if (to) {
    return (
      <Link to={to} className={classNames}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} type={type} disabled={disabled} className={classNames} {...props}>
      {children}
    </button>
  );
});
