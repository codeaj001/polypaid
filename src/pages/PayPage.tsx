import { useEffect, useState, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { PaymentLink } from '@/lib/types';
import { getLinkBySlug, recordAttempt, markPaidByIntentOptimistic } from '@/lib/store';
import { getPolygonscanTxUrl } from '@/lib/trails';
import { TrailsPayWidget } from '@/components/TrailsPayWidget';
import { QRCodeModal } from '@/components/QRCodeModal';
import { AgentPayModal } from '@/components/AgentPayModal';
import { useLinkStatus } from '@/hooks/useLinkStatus';
import { Badge, IconAgent, IconCheck, IconExternal, IconQr, LogoMark, Skeleton } from '@/components/ui';
import { NotFound } from './NotFound';

import { formatAmountDisplay } from '@/lib/amount';

export function PayPage() {
  const { slug } = useParams<{ slug: string }>();
  const [link, setLink] = useState<PaymentLink | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getLinkBySlug(slug).then((l) => {
      if (!cancelled) setLink(l);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (link === undefined) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-full max-w-[480px] space-y-4">
          <Skeleton className="h-[420px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }
  if (link === null) return <NotFound />;

  return <PayPageContent link={link} />;
}

function PayPageContent({ link }: { link: PaymentLink }) {
  const status = useLinkStatus(link.id, link.slug, computeEffectiveStatus(link));
  const [receiptTx, setReceiptTx] = useState<string | null>(null);
  const [pendingIntentId, setPendingIntentId] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const formattedAmount = formatAmountDisplay(link.amount);

  useEffect(() => {
    if (status === 'paid' && link.redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = link.redirectUrl!;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, link.redirectUrl]);

  if (status === 'expired') {
    return (
      <Shell>
        <div className="py-10 text-center">
          <div className="mb-2 text-h3">This link has expired</div>
          <p className="text-sm text-ink-soft">Ask {link.creatorHandle} to send you a new one.</p>
        </div>
      </Shell>
    );
  }

  if (status === 'paid') {
    return (
      <Shell statusLabel="Paid" statusGood onQrClick={() => setShowQr(true)} onAgentClick={() => setShowAgent(true)}>
        <Avatar />
        <div className="mb-1 text-sm text-ink-soft">
          Paid to <b className="text-ink">@{link.creatorHandle}</b>
        </div>
        <div className="text-[44px] font-semibold tracking-tight">${formattedAmount}</div>
        <div className="mb-7 mt-1 text-[14.5px] text-ink-soft">
          {link.memo} {link.invoiceRef ? `· ${link.invoiceRef}` : ''}
        </div>
        <div className="rounded-2xl border border-good/20 bg-good-dim py-4 text-center text-sm font-semibold text-good">
          <span className="inline-flex items-center justify-center gap-2">
            <IconCheck className="h-4 w-4" />
            Payment confirmed
          </span>
          {receiptTx && (
            <div className="mt-1 font-mono text-xs">
              <a
                href={getPolygonscanTxUrl(receiptTx)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80"
              >
                View on Polygonscan
                <IconExternal className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
        {link.redirectUrl && (
          <p className="mt-4 animate-pulse text-center text-xs text-ink-soft">
            Redirecting to seller site in 3 seconds…
          </p>
        )}
        <div className="mt-6 text-center font-mono text-[10.5px] tracking-[0.06em] text-ink-soft">
          SETTLED AS {link.settlementToken} · {link.settlementChain.toUpperCase()} — ROUTED BY TRAILS
        </div>

        <QRCodeModal
          url={window.location.href}
          title={`Paid $${formattedAmount} USDC`}
          isOpen={showQr}
          onClose={() => setShowQr(false)}
        />
        <AgentPayModal link={link} isOpen={showAgent} onClose={() => setShowAgent(false)} />
      </Shell>
    );
  }

  return (
    <Shell statusLabel="Awaiting payment" onQrClick={() => setShowQr(true)} onAgentClick={() => setShowAgent(true)}>
      <Avatar />
      <div className="mb-1 text-sm text-ink-soft">
        Payment request from <b className="text-ink">@{link.creatorHandle}</b>
      </div>
      <div className="text-[44px] font-semibold tracking-tight">${formattedAmount}</div>
      <div className="mb-6 mt-1 text-[14.5px] text-ink-soft">
        {link.memo} {link.invoiceRef ? `· ${link.invoiceRef}` : ''}
      </div>
      <div className="mb-6 h-px bg-line" />

      <TrailsPayWidget
        toAddress={link.recipientAddress}
        toChainId={link.settlementChainId}
        toToken={link.settlementToken}
        toAmount={String(link.amount)}
        onIntentCreated={async (intent) => {
          setPendingIntentId(intent.id);
          await recordAttempt(link.id, intent.fromAddress, intent.id).catch(() => {});
        }}
        onSuccess={async (result) => {
          setReceiptTx(result.txHash);
          if (pendingIntentId) {
            await markPaidByIntentOptimistic(pendingIntentId, result.txHash, null).catch(() => {});
          }
        }}
      />

      <QRCodeModal
        url={window.location.href}
        title={`Pay $${link.amount} USDC`}
        isOpen={showQr}
        onClose={() => setShowQr(false)}
      />
      <AgentPayModal link={link} isOpen={showAgent} onClose={() => setShowAgent(false)} />
    </Shell>
  );
}

function computeEffectiveStatus(link: PaymentLink) {
  const isExpired = link.expiresAt ? new Date(link.expiresAt).getTime() < Date.now() : false;
  return isExpired && link.status === 'open' ? 'expired' : link.status;
}

function Shell({
  children,
  statusLabel,
  statusGood,
  onQrClick,
  onAgentClick,
}: {
  children: ReactNode;
  statusLabel?: string;
  statusGood?: boolean;
  onQrClick?: () => void;
  onAgentClick?: () => void;
}) {
  return (
    <div className="flex justify-center py-10 sm:py-14 animate-fade-up">
      <div className="w-full max-w-[480px] rounded-3xl border border-line bg-surface p-7 shadow-lift sm:p-9">
        <div className="mb-7 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.06em] text-ink-soft">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-blue text-white">
              <LogoMark className="h-2 w-2" />
            </span>
            polypay.link
          </div>
          <div className="flex items-center gap-2">
            {onQrClick && (
              <button
                type="button"
                onClick={onQrClick}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 font-mono text-[10.5px] text-ink transition-colors duration-200 hover:border-blue hover:text-blue"
                title="Show QR Code"
              >
                <IconQr className="h-3.5 w-3.5" />
                QR
              </button>
            )}
            {onAgentClick && (
              <button
                type="button"
                onClick={onAgentClick}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 font-mono text-[10.5px] text-ink-soft transition-colors duration-200 hover:border-blue hover:text-blue"
                title="Agent x402 Spec"
              >
                <IconAgent className="h-3.5 w-3.5" />
                x402
              </button>
            )}
            {statusLabel && <Badge tone={statusGood ? 'good' : 'blue'}>{statusLabel}</Badge>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div
      className="mb-4 h-14 w-14 rounded-full"
      style={{ background: 'linear-gradient(135deg,#0059FF,#7aa6ff)' }}
    />
  );
}
