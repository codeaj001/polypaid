import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { IconClose } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ isOpen, onClose, title, description, children, className, size = 'md' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto p-4 sm:p-6 animate-fade-in">
      {/* Clickable Backdrop Overlay */}
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="fixed inset-0 bg-ink/50 backdrop-blur-[10px]"
        onClick={onClose}
      />

      {/* Centering Wrapper */}
      <div className="relative flex min-h-full items-center justify-center pointer-events-none py-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          className={clsx(
            'pointer-events-auto relative my-auto w-full max-h-[calc(100vh-3rem)] flex flex-col text-left rounded-3xl border border-line bg-surface p-6 shadow-modal sm:p-7 animate-scale-in',
            sizes[size],
            className
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink-soft transition-colors duration-200 hover:bg-line hover:text-ink"
            aria-label="Close"
          >
            <IconClose className="h-4 w-4" />
          </button>

          {(title || description) && (
            <div className="mb-5 pr-10 shrink-0">
              {title && (
                <h3 id="modal-title" className="text-h3 text-ink">
                  {title}
                </h3>
              )}
              {description && <p className="mt-1 text-[13px] text-ink-soft">{description}</p>}
            </div>
          )}

          <div className="overflow-y-auto flex-1 min-h-0 pr-0.5">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
