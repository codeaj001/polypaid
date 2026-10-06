import { useEffect, useState } from 'react';
import type { PayProps } from '0xtrails/widget';
import { TRAILS_API_KEY, isTrailsConfigured } from '@/lib/trails';
import { useWallet } from '@/context/WalletContext';

interface TrailsPayWidgetProps {
  toAddress: string;
  toChainId: number;
  toToken: string;
  toAmount: string;
  onPaymentStarted?: (payment: { id: string; fromAddress: string }) => void;
  onPaymentSubmitted?: (payment: { id: string }) => void;
}

export function TrailsPayWidget(props: TrailsPayWidgetProps) {
  const { address } = useWallet();
  const [Pay, setPay] = useState<React.ComponentType<PayProps> | null>(null);
  const [sdkUnavailable, setSdkUnavailable] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTrailsConfigured()) return;

    import('0xtrails/widget')
      .then((module) => {
        if (module.Pay) setPay(() => module.Pay);
        else setSdkUnavailable(true);
      })
      .catch(() => setSdkUnavailable(true));
  }, []);

  if (!isTrailsConfigured() || sdkUnavailable) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
        <div className="text-sm font-semibold text-ink">Payments are temporarily unavailable</div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
          The production Trails payment service is not configured. No wallet transaction will be requested.
        </p>
      </div>
    );
  }

  if (props.toChainId !== 137 || props.toToken.toUpperCase() !== 'USDC') {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger-dim p-4 text-center text-sm text-danger">
        This link has an unsupported settlement configuration.
      </div>
    );
  }

  if (!Pay) {
    return (
      <div className="rounded-2xl border border-line bg-paper p-5 text-center text-sm text-ink-soft">
        Loading secure payment options…
      </div>
    );
  }

  return (
    <div>
      {paymentError && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger-dim p-3 text-xs text-danger">
          {paymentError}
        </div>
      )}
      <Pay
        apiKey={TRAILS_API_KEY}
        theme="auto"
        to={{
          recipient: props.toAddress,
          token: 'USDC',
          chain: 'polygon',
          amount: props.toAmount,
        }}
        payMessage="PolyPaid payment request"
        buttonText="Pay securely with Trails"
        onPaymentStart={({ sessionId }: { sessionId: string }) => {
          setPaymentError(null);
          props.onPaymentStarted?.({ id: sessionId, fromAddress: address || '' });
        }}
        onPaymentSuccess={({ sessionId }: { sessionId: string }) => {
          props.onPaymentSubmitted?.({ id: sessionId });
        }}
        onPaymentError={({ error }: { error?: unknown }) => {
          setPaymentError(error instanceof Error ? error.message : 'The payment could not be completed.');
        }}
      />
      <p className="mt-4 text-center font-mono text-[10.5px] tracking-[0.06em] text-ink-soft">
        EXACT-OUTPUT USDC · POLYGON — VERIFIED SERVER-SIDE
      </p>
    </div>
  );
}
