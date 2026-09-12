import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, trailing, id, ...props },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label-caps mb-2 block">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-xl border bg-paper px-3.5 py-3 text-[15px] text-ink placeholder:text-ink-faint',
            'transition-[border-color,box-shadow,background-color] duration-200 ease-apple',
            'focus:outline-none focus:border-blue focus:bg-surface focus:shadow-focus',
            error ? 'border-danger' : 'border-line',
            trailing && 'pr-12',
            className
          )}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p className="mt-2 text-[13px] text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-[13px] text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
});
