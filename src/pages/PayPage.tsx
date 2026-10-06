import { useEffect, useState, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { PaymentLink } from '@/lib/types';
import { getLinkBySlug, recordAttempt, verifyPaymentSession } from '@/lib/store';
import { TrailsPayWidget } from '@/components/TrailsPayWidget';
import { QRCodeModal } from '@/components/QRCodeModal';
import { useLinkStatus } from '@/hooks/useLinkStatus';
import { Badge, IconCheck, IconQr, LogoMark, Skeleton } from '@/components/ui';
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
  const status = useLinkStatus(link.id, link.slug, computeEffectiveStatus(link), link.expiresAt);
  const [submittedSessionId, setSubmittedSessionId] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const formattedAmount = formatAmountDisplay(link.amount);

  useEffect(() => {
    if (status === 'paid' && link.redirectUrl) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            window.location.href = link.redirectUrl!;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
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
      <Shell statusLabel="Paid" statusGood onQrClick={() => setShowQr(true)}>
        <Avatar />
        <div className="mb-1 text-sm text-ink-soft">
          Paid to <b className="text-ink">@{link.creatorHandle}</b>
        </div>
        <div className="text-[44px] font-semibold tracking-tight">${formattedAmount}</div>
        <div className="mb-7 mt-1 text-[14.5px] text-ink-soft">
          {link.memo} {link.invoiceRef ? `· ${link.invoiceRef}` : ''}
        </div>
        <div className="rounded-2xl border border-good/20 bg-good-dim py-4 text-center text-sm font-semibold text-good shadow-soft">
          <span className="inline-flex items-center justify-center gap-2">
            <IconCheck className="h-4 w-4" />
            Payment settlement verified
          </span>
        </div>
        {link.redirectUrl && (
          <div className="mt-5 rounded-2xl border border-blue-mid/40 bg-blue-dim/40 p-4 text-center animate-fade-up">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-blue">
              <span>Redirecting to seller site…</span>
              <span>{countdown}s</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue/15">
              <div
                className="h-full bg-blue transition-all duration-1000 ease-linear"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              />
            </div>
            <a
              href={link.redirectUrl}
              className="mt-2.5 inline-block text-xs font-medium text-blue underline underline-offset-2 hover:opacity-80"
            >
              Click here if not redirected automatically →
            </a>
          </div>
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
      </Shell>
    );
  }

  return (
    <Shell statusLabel="Awaiting payment" onQrClick={() => setShowQr(true)}>
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
        onPaymentStarted={async (intent) => {
          setAttemptError(null);
          try {
            await recordAttempt(link.id, intent.fromAddress, intent.id);
          } catch (error: any) {
            setAttemptError(error?.message || 'The payment session could not be registered. Do not submit payment yet.');
          }
        }}
        onPaymentSubmitted={async (payment) => {
          setSubmittedSessionId(payment.id);
          setVerificationError(null);
          try {
            // Register again in case the provider completed before the start
            // callback's database request finished. The RPC is idempotent.
            await recordAttempt(link.id, '', payment.id);
            const result = await verifyWithRetry(link.id, payment.id);
            if (!result.verified) setVerificationError('Settlement is still being verified. This page will update automatically.');
          } catch (error: any) {
            setVerificationError(error?.message || 'Settlement verification is temporarily unavailable.');
          }
        }}
      />

      {attemptError && (
        <div className="mt-3 rounded-xl border border-danger/20 bg-danger-dim p-3 text-center text-xs text-danger">
          {attemptError}
        </div>
      )}

      {submittedSessionId && (
        <div className="mt-4 rounded-xl border border-blue-mid/40 bg-blue-dim p-3 text-center text-xs text-blue">
          Payment submitted. Waiting for server-side settlement verification…
        </div>
      )}

      {verificationError && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-ink-soft">
          {verificationError}
        </div>
      )}

      <QRCodeModal
        url={window.location.href}
        title={`Pay $${link.amount} USDC`}
        isOpen={showQr}
        onClose={() => setShowQr(false)}
      />
    </Shell>
  );
}

async function verifyWithRetry(linkId: string, sessionId: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const result = await verifyPaymentSession(linkId, sessionId);
      if (result.verified) return result;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 2 ** attempt * 1000));
  }
  throw lastError instanceof Error ? lastError : new Error('Settlement verification timed out.');
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
}: {
  children: ReactNode;
  statusLabel?: string;
  statusGood?: boolean;
  onQrClick?: () => void;
}) {
  return (
    <div className="flex justify-center py-10 sm:py-14 animate-fade-up">
      <div className="w-full max-w-[480px] rounded-3xl border border-line bg-surface p-7 shadow-lift sm:p-9">
        <div className="mb-7 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.06em] text-ink-soft">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-blue text-white">
              <LogoMark className="h-2 w-2" />
            </span>
            polypaid.link
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
