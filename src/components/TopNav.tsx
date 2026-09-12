import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletConnectButton } from './WalletConnectButton';
import { LogoMark, IconMenu, IconClose } from '@/components/ui';
import clsx from 'clsx';

const TABS = [
  { href: '/', label: 'Home' },
  { href: '/create', label: 'Create' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function TopNav() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 -mx-5 mb-2 border-b border-line/60 bg-paper/80 px-5 backdrop-blur-xl sm:-mx-7 sm:px-7">
      <div className="flex items-center justify-between py-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-ink transition-opacity duration-200 hover:opacity-80"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-blue text-white">
            <LogoMark className="h-4 w-4" />
          </span>
          PolyPay
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-line bg-surface/80 p-1 shadow-soft md:flex">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={clsx(
                  'rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-200',
                  active ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <WalletConnectButton />
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <IconClose className="h-4 w-4" /> : <IconMenu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-line pb-4 pt-3 animate-fade-up md:hidden">
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'rounded-xl px-3.5 py-3 text-[15px] font-medium transition-colors duration-200',
                    active ? 'bg-ink text-white' : 'text-ink-soft hover:bg-black/[0.04] hover:text-ink'
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 sm:hidden">
            <WalletConnectButton />
          </div>
        </div>
      )}
    </header>
  );
}
