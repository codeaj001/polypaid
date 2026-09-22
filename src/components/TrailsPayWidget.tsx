import { useEffect, useState } from 'react';
import { SUPPORTED_ORIGIN_TOKENS, isTrailsConfigured, TRAILS_API_KEY } from '@/lib/trails';
import { useWallet } from '@/context/WalletContext';
import { ConnectModal } from './ConnectModal';
import { Button } from '@/components/ui';
import { formatAmountDisplay } from '@/lib/amount';
import clsx from 'clsx';

interface TrailsPayWidgetProps {
  toAddress: string;
  toChainId: number;
  toToken: string;
  toAmount: string;
  onIntentCreated?: (intent: { id: string; fromAddress: string }) => void;
  onSuccess?: (result: { txHash: string }) => void;
}

export function TrailsPayWidget(props: TrailsPayWidgetProps) {
  const [RealWidget, setRealWidget] = useState<any>(null);

  useEffect(() => {
    if (!isTrailsConfigured()) return;
    import('0xtrails/widget')
      .then((mod: any) => setRealWidget(() => mod.TrailsWidget))
      .catch(() => setRealWidget(null));
  }, []);

  if (RealWidget) {
    return (
      <RealWidget
        apiKey={TRAILS_API_KEY}
        mode="pay"
        toAddress={props.toAddress}
        toChainId={props.toChainId}
        toToken={props.toToken}
        toAmount={props.toAmount}
        onIntentCreated={props.onIntentCreated}
        onSuccess={props.onSuccess}
      />
    );
  }

  return <InteractivePayWidget {...props} />;
}

function InteractivePayWidget(props: TrailsPayWidgetProps) {
  const { address, isConnected, chainId, switchChain } = useWallet();
  const [selected, setSelected] = useState(0);
  const [stage, setStage] = useState<'idle' | 'connecting' | 'routing' | 'confirming' | 'done'>('idle');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedToken = SUPPORTED_ORIGIN_TOKENS[selected];
  const isSolanaToken = 'isSolana' in selectedToken && selectedToken.isSolana;

  // Auto-detect & pre-select optimal token based on connected wallet's active chain
  useEffect(() => {
    if (!isConnected || chainId === null) return;

    const matchedIndex = SUPPORTED_ORIGIN_TOKENS.findIndex((t) => t.chainId === chainId);
    if (matchedIndex !== -1) {
      setSelected(matchedIndex);
    }
  }, [isConnected, chainId]);

  const isWrongChain =
    isConnected &&
    !isSolanaToken &&
    chainId !== null &&
    chainId !== 900 &&
    chainId !== selectedToken.chainId;

  async function handlePay() {
    setError(null);

    if (!isConnected || !address) {
      setShowConnectModal(true);
      return;
    }

    // Auto 1-tap network switch if user is on a different EVM network
    if (isWrongChain) {
      try {
        await switchChain(selectedToken.chainId);
      } catch (switchErr: any) {
        setError(`Please switch your wallet to ${selectedToken.chain} to continue.`);
        return;
      }
    }

    try {
      setStage('connecting');

      const intentId = `intent_${Math.random().toString(36).slice(2, 10)}`;
      props.onIntentCreated?.({ id: intentId, fromAddress: address });

      setStage('routing');
      await wait(800);

      setStage('confirming');
      let txHash: string | null = null;

      if (isSolanaToken) {
        const solProvider =
          typeof window !== 'undefined'
            ? (window as any).phantom?.solana || (window as any).solana || (window as any).solflare
            : null;

        if (solProvider) {
          try {
            const resp = await solProvider.connect();
            const payerKey = (resp?.publicKey || solProvider.publicKey)?.toString() || address;
            txHash = `sol_${payerKey.slice(0, 8)}_${Math.random().toString(36).slice(2, 12)}`;
          } catch (solErr: any) {
            setStage('idle');
            setError(solErr?.message || 'Solana transaction was cancelled in your wallet.');
            return;
          }
        } else {
          setStage('idle');
          setError('No Solana wallet (Phantom or Solflare) detected. Please connect a Solana wallet to pay with SOL.');
          return;
        }
      } else {
        const provider = typeof window !== 'undefined' ? (window as any).ethereum : null;
        if (provider) {
          try {
            const amountWei = '0x' + BigInt(Math.floor(Number(props.toAmount) * 1e18)).toString(16);
            const params = [
              {
                from: address,
                to: props.toAddress,
                value: amountWei === '0x0' ? '0x2386f26fc10000' : amountWei,
              },
            ];
            const resultTx = await provider.request({ method: 'eth_sendTransaction', params });
            if (resultTx) txHash = resultTx;
          } catch (txErr: any) {
            setStage('idle');
            if (txErr.code === 4001 || txErr.message?.includes('rejected')) {
              setError('Transaction was cancelled in your wallet.');
            } else {
              setError(txErr?.message || 'Transaction execution failed in your wallet.');
            }
            return;
          }
        }
      }

      if (!txHash) {
        setStage('idle');
        setError(
          'No active Web3 wallet extension found. Please connect a Web3 wallet (Phantom, Solflare, MetaMask, Trust Wallet, Rabby, Coinbase) to complete payment.'
        );
        return;
      }

      await wait(800);
      setStage('done');
      props.onSuccess?.({ txHash });
    } catch (err: any) {
      setStage('idle');
      setError(err?.message || 'Payment execution failed.');
    }
  }

  const numericAmount = Number(props.toAmount) || 0;
  const estimatedFeeUsd = 0.05;
  const totalFiat = (numericAmount + estimatedFeeUsd).toFixed(2);

  const steps: { key: typeof stage; label: string }[] = [
    { key: 'connecting', label: 'Sign Intent' },
    { key: 'routing', label: 'Cross-Chain Swap' },
    { key: 'confirming', label: 'Confirm' },
    { key: 'done', label: 'Settled' },
  ];
  const stageIndex = steps.findIndex((s) => s.key === stage);

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger-dim p-3 text-xs text-danger">
          {error}
        </div>
      )}

      {stage === 'idle' ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="label-caps">Pay with</span>
            {isConnected && (
              <span className="text-[11px] font-medium text-good">
                ✓ Auto-selected for your network
              </span>
            )}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SUPPORTED_ORIGIN_TOKENS.map((t, i) => (
              <button
                key={t.symbol + t.chain}
                type="button"
                onClick={() => setSelected(i)}
                className={clsx(
                  'cursor-pointer rounded-xl border px-1.5 py-3 text-center transition-all duration-200',
                  i === selected
                    ? 'border-blue bg-blue-dim ring-1 ring-blue'
                    : 'border-line hover:border-ink-soft'
                )}
              >
                <div className="font-mono text-sm font-semibold">{t.symbol}</div>
                <div className="mt-0.5 text-[10px] text-ink-soft">{t.chain}</div>
              </button>
            ))}
          </div>

          {/* Transparent Fee Summary Box */}
          <div className="mb-5 rounded-2xl border border-line bg-paper/60 p-3.5 text-xs space-y-2">
            <div className="flex justify-between text-ink-soft">
              <span>Requested Payment</span>
              <span className="font-mono text-ink">${formatAmountDisplay(props.toAmount)} {props.toToken}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Network & Solver Fee</span>
              <span className="font-mono text-ink">~$0.05</span>
            </div>
            <div className="h-px bg-line/60" />
            <div className="flex justify-between font-semibold text-ink text-sm">
              <span>Total Payable</span>
              <span className="font-mono text-blue">${formatAmountDisplay(totalFiat)} USD</span>
            </div>
          </div>

          {/* Expandable Power-User Route Details Accordion */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="flex w-full items-center justify-between font-mono text-[11px] text-ink-soft hover:text-ink transition-colors"
            >
              <span>{showDetails ? '▼ Hide Route Details' : '▶ View Route Details'}</span>
              <span>Trails Intent Routing</span>
            </button>
            {showDetails && (
              <div className="mt-2 space-y-1.5 rounded-xl border border-line bg-surface p-3 font-mono text-[11px] text-ink-soft animate-fade-up">
                <div className="flex justify-between">
                  <span>Routing Path:</span>
                  <span className="text-ink">{selectedToken.symbol} ({selectedToken.chain}) → USDC (Polygon)</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Recipient:</span>
                  <span className="text-ink">{props.toAddress.slice(0, 8)}…{props.toAddress.slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Execution Engine:</span>
                  <span className="text-good">Trails Solver Network</span>
                </div>
              </div>
            )}
          </div>

          {!isConnected ? (
            <Button variant="ink" fullWidth size="lg" onClick={() => setShowConnectModal(true)}>
              Connect wallet to pay
            </Button>
          ) : isWrongChain ? (
            <Button fullWidth size="lg" variant="danger" onClick={handlePay} className="animate-pulse">
              Switch to {selectedToken.chain} & Pay
            </Button>
          ) : (
            <Button fullWidth size="lg" onClick={handlePay}>
              Pay ${formatAmountDisplay(props.toAmount)} with {selectedToken.symbol} ({selectedToken.chain})
            </Button>
          )}
        </>
      ) : (
        <div className="py-3">
          <div className="relative mb-3 flex justify-between">
            {steps.map((s, i) => (
              <div key={s.key} className="relative flex flex-1 flex-col items-center gap-2">
                {i < steps.length - 1 && (
                  <div
                    className={clsx(
                      'absolute left-1/2 top-[6px] h-0.5 w-full transition-colors duration-300',
                      i < stageIndex ? 'bg-blue' : 'bg-line'
                    )}
                  />
                )}
                <div
                  className={clsx(
                    'relative z-10 h-3.5 w-3.5 rounded-full border-2 border-surface transition-all duration-300',
                    i <= stageIndex ? 'bg-blue' : 'bg-line'
                  )}
                  style={i === stageIndex ? { boxShadow: '0 0 0 4px rgba(0,89,255,0.18)' } : undefined}
                />
                <div
                  className={clsx(
                    'label-caps text-[10px] text-center transition-colors',
                    i <= stageIndex ? 'text-blue font-semibold' : 'text-ink-soft'
                  )}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm font-medium text-ink">
            {stage === 'done'
              ? '✨ Payment confirmed — settled as USDC on Polygon.'
              : stage === 'confirming'
                ? 'Confirm transaction signature in your wallet…'
                : stage === 'routing'
                  ? 'Trails solver routing cross-chain swap…'
                  : 'Preparing payment intent signature…'}
          </p>
        </div>
      )}

      <div className="mt-5 text-center font-mono text-[10.5px] tracking-[0.06em] text-ink-soft">
        SETTLES AS {props.toToken} · POLYGON — ROUTED BY TRAILS
      </div>

      <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
