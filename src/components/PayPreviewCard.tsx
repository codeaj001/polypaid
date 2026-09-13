import { useState } from 'react';
import { QRCodeModal } from './QRCodeModal';
import { Button, IconQr, LogoMark } from '@/components/ui';

import { formatAmountDisplay } from '@/lib/amount';

interface PayPreviewCardProps {
  handle: string;
  amount: string;
  memo: string;
  url?: string;
}

export function PayPreviewCard({ handle, amount, memo, url }: PayPreviewCardProps) {
  const [showQr, setShowQr] = useState(false);
  const previewUrl = url || `${window.location.origin}`;
  const displayAmount = formatAmountDisplay(amount);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-lift">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64"
          style={{ background: 'radial-gradient(circle, rgba(0,89,255,0.45), transparent 70%)' }}
        />
        <div className="relative z-10">
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-blue text-white">
                <LogoMark className="h-2.5 w-2.5" />
              </span>
              PolyPaid
            </div>
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 font-mono text-xs text-white transition-colors duration-200 hover:bg-white/20"
            >
              <IconQr className="h-3.5 w-3.5" />
              QR
            </button>
          </div>

          <div
            className="mb-4 h-11 w-11 rounded-full"
            style={{ background: 'linear-gradient(135deg,#0059FF,#7aa6ff)' }}
          />
          <div className="text-[13px] text-white/60">
            Pay to <b className="text-white">@{handle || 'you'}</b>
          </div>
          <div className="mt-1 mb-1 text-[44px] font-semibold tracking-tight">
            ${displayAmount} <span className="text-[20px] font-medium opacity-60">USDC</span>
          </div>
          <div className="mb-6 text-sm text-white/70">{memo || 'What this payment is for'}</div>

          <Button fullWidth onClick={() => setShowQr(true)} className="mb-3.5">
            Pay with any token, any chain
          </Button>

          <div className="flex flex-wrap gap-1.5">
            {['ETH', 'USDT', 'DAI', 'POL', '+1,000 more'].map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[10.5px] text-white/80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <QRCodeModal
        url={previewUrl}
        title={`Pay $${amount || '0'} USDC`}
        isOpen={showQr}
        onClose={() => setShowQr(false)}
      />
    </>
  );
}
