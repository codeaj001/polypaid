import { useState, MouseEvent } from 'react';
import { PaymentLink } from '@/lib/types';
import { QRCodeModal } from './QRCodeModal';
import { Badge, Button, EmptyState, IconPlus, IconQr } from '@/components/ui';
import clsx from 'clsx';

import { formatAmountDisplay } from '@/lib/amount';

export function LinksTable({ links }: { links: PaymentLink[] }) {
  const [selectedQrLink, setSelectedQrLink] = useState<{ url: string; title: string } | null>(null);

  function openQr(e: MouseEvent, slug: string, memo: string, amount: number) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/${slug}`;
    setSelectedQrLink({ url, title: `Pay $${formatAmountDisplay(amount)} USDC · ${memo}` });
  }

  if (links.length === 0) {
    return (
      <EmptyState
        title="No links yet"
        description="Create your first payment link to start accepting USDC from any token, any chain."
        action={
          <Button to="/create" size="sm">
            <IconPlus className="h-4 w-4" />
            Create a link
          </Button>
        }
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="surface hidden overflow-hidden md:block">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] border-b border-line px-5 py-3.5 label-caps">
          <span>Link</span>
          <span>Settlement</span>
          <span>Amount</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {links.map((link) => (
          <a
            key={link.id}
            href={`/${link.slug}`}
            target="_blank"
            rel="noreferrer"
            className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center border-b border-line px-5 py-4 text-sm transition-colors duration-200 last:border-b-0 hover:bg-paper"
          >
            <div>
              <div className="font-semibold tracking-tight text-ink">{link.memo}</div>
              <div className="mt-0.5 font-mono text-[11px] text-ink-soft">
                {link.invoiceRef ?? link.slug} · {link.creatorHandle}
              </div>
            </div>
            <div className="font-mono text-xs text-ink-soft">
              {link.settlementToken} · {link.settlementChain}
            </div>
            <div className="font-mono font-medium">${formatAmountDisplay(link.amount)}</div>
            <div>
              <StatusBadge status={link.status} />
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={(e) => openQr(e, link.slug, link.memo, link.amount)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-paper text-ink-soft transition-colors duration-200 hover:border-blue hover:text-blue"
                title="Show QR Code"
                aria-label="Show QR code"
              >
                <IconQr className="h-4 w-4" />
              </button>
            </div>
          </a>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {links.map((link) => (
          <a
            key={link.id}
            href={`/${link.slug}`}
            target="_blank"
            rel="noreferrer"
            className="surface block p-4 transition-[transform,box-shadow] duration-200 hover:shadow-lift"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold tracking-tight text-ink">{link.memo}</div>
                <div className="mt-1 font-mono text-[11px] text-ink-soft">
                  {link.invoiceRef ?? link.slug}
                </div>
              </div>
              <StatusBadge status={link.status} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[18px] font-semibold tracking-tight">${formatAmountDisplay(link.amount)}</div>
                <div className="font-mono text-[11px] text-ink-soft">
                  {link.settlementToken} · {link.settlementChain}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => openQr(e, link.slug, link.memo, link.amount)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper text-ink-soft"
                aria-label="Show QR code"
              >
                <IconQr className="h-4 w-4" />
              </button>
            </div>
          </a>
        ))}
      </div>

      {selectedQrLink && (
        <QRCodeModal
          url={selectedQrLink.url}
          title={selectedQrLink.title}
          isOpen={true}
          onClose={() => setSelectedQrLink(null)}
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: PaymentLink['status'] }) {
  return (
    <Badge
      tone={
        status === 'paid' ? 'good' : status === 'open' ? 'warn' : 'neutral'
      }
      className={clsx(status === 'expired' || status === 'void' ? 'opacity-80' : undefined)}
    >
      {status}
    </Badge>
  );
}
