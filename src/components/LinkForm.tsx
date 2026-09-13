import { useState, FormEvent, ReactNode } from 'react';
import { useWallet, shortAddress, isEvmAddress } from '@/context/WalletContext';
import { createLink } from '@/lib/store';
import { PayPreviewCard } from './PayPreviewCard';
import { QRCodeModal } from './QRCodeModal';
import { ConnectModal } from './ConnectModal';
import {
  Button,
  IconCheck,
  IconCopy,
  IconQr,
  Input,
  PageHeader,
} from '@/components/ui';

import { formatWithCommas } from '@/lib/amount';

export function LinkForm() {
  const { address, isConnected, chainId, switchToPolygon } = useWallet();

  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const isEvm = isEvmAddress(address);
  const isPolygon = isEvm && (chainId === 137 || chainId === 80002);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isConnected || !address) {
      setError('Wallet connection required! Please connect a Polygon-compatible EVM wallet.');
      setShowConnectModal(true);
      return;
    }

    if (!isEvm) {
      setError('Solana wallets cannot receive Polygon USDC deposits. Please connect a Polygon-compatible EVM wallet (0x...).');
      setShowConnectModal(true);
      return;
    }

    if (!isPolygon) {
      try {
        await switchToPolygon();
      } catch {
        setError('Please switch your wallet network to Polygon Mainnet before creating a payment link.');
        return;
      }
    }

    const numericAmount = Number(amount.replace(/,/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    if (!memo.trim()) {
      setError('Add a short description of what this is for');
      return;
    }

    setSubmitting(true);
    try {
      const link = await createLink({
        amount: numericAmount,
        memo: memo.trim(),
        invoiceRef: invoiceRef.trim() || undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        redirectUrl: redirectUrl.trim() || undefined,
        recipientAddress: address,
      });
      const generatedUrl = `${window.location.origin}/${link.slug}`;
      setCreatedUrl(generatedUrl);
      setShowQrModal(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    if (!createdUrl) return;
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="grid gap-10 py-10 md:grid-cols-[1.1fr_0.9fr] animate-fade-up">
      <div>
        <PageHeader
          title="Create a payment link"
          description="Fill this out once — PolyPaid builds the shareable link and QR code, live."
          className="mb-8"
        />

        <form onSubmit={handleSubmit} className="surface p-6 sm:p-7">
          <Field label="Amount to receive (USDC · Polygon)">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(formatWithCommas(e.target.value))}
              className="w-full border-0 border-b-[1.5px] border-line bg-transparent py-2 text-[40px] font-semibold tracking-tight text-ink placeholder:text-ink-faint/40 focus:border-blue focus:outline-none"
              required
            />
          </Field>

          <div className="mb-5">
            <Input
              label="What's this for?"
              type="text"
              placeholder="e.g., Consulting Package / Design Sprint"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              required
            />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Invoice / memo ref"
              type="text"
              placeholder="e.g., INV-001"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
            />
            <Input
              label="Expires in (days)"
              type="number"
              min={0}
              placeholder="e.g., 30"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </div>

          <div className="mb-5">
            <Input
              label="Success redirect URL (optional)"
              type="url"
              placeholder="https://yourwebsite.com/thanks"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
            />
          </div>

          <Field label="Recipient wallet (Required for deposits)">
            {isConnected && address ? (
              isEvm ? (
                isPolygon ? (
                  <div className="flex items-center justify-between rounded-xl border border-dashed border-good/40 bg-good-dim px-4 py-3 font-mono text-[13px] text-good">
                    <span>{shortAddress(address)} — Polygon recipient ready</span>
                    <IconCheck className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-3 text-[13.5px]">
                    <div className="min-w-0">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">⚠️ Network mismatch ({shortAddress(address)})</span>
                      <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-300/80">Switch network to Polygon Mainnet to generate link.</p>
                    </div>
                    <Button type="button" size="sm" variant="danger" onClick={switchToPolygon} className="shrink-0 text-xs">
                      Switch Network
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-danger/40 bg-danger-dim px-4 py-3 text-[13.5px]">
                  <div className="min-w-0">
                    <span className="font-semibold text-danger">⚠️ Incompatible Wallet (Solana: {shortAddress(address)})</span>
                    <p className="mt-0.5 text-xs text-danger/80">Payment links settle in Polygon USDC. Solana wallets cannot receive EVM deposits.</p>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setShowConnectModal(true)} className="shrink-0 text-xs">
                    Connect EVM Wallet
                  </Button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="flex w-full items-center justify-between rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-3 text-left text-[13.5px] font-medium text-amber-600 transition-colors duration-200 hover:border-blue hover:text-blue dark:text-amber-400"
              >
                <span>⚠️ Connect Polygon wallet to set deposit recipient →</span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs">Required</span>
              </button>
            )}
          </Field>

          {error && <p className="mb-4 text-sm font-medium text-danger">{error}</p>}

          <Button
            type={isConnected && isEvm && isPolygon ? 'submit' : 'button'}
            onClick={
              !isConnected || !isEvm
                ? () => setShowConnectModal(true)
                : !isPolygon
                ? switchToPolygon
                : undefined
            }
            fullWidth
            size="lg"
            disabled={submitting}
            className="mt-1"
          >
            {submitting
              ? 'Generating…'
              : !isConnected
              ? 'Connect wallet to generate link'
              : !isEvm
              ? 'Connect Polygon EVM wallet'
              : !isPolygon
              ? 'Switch to Polygon to generate link'
              : 'Generate link & QR'}
          </Button>
        </form>

        {createdUrl && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-mid bg-blue-dim px-5 py-4 animate-fade-up sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="label-caps mb-1 text-blue">Link created</div>
              <a
                href={createdUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all font-mono text-sm text-ink underline underline-offset-2"
              >
                {createdUrl}
              </a>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowQrModal(true)}>
                <IconQr className="h-3.5 w-3.5" />
                QR
              </Button>
              <Button size="sm" variant="secondary" onClick={copyLink}>
                {copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="self-start md:sticky md:top-24">
        <div className="label-caps mb-3.5">Live preview</div>
        <PayPreviewCard
          handle="you"
          amount={amount || '0'}
          memo={memo || 'Payment description'}
          url={createdUrl || undefined}
        />
      </div>

      {createdUrl && (
        <QRCodeModal
          url={createdUrl}
          title={`Scan to pay $${amount || '0'} USDC`}
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
        />
      )}

      <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <label className="label-caps mb-2 block">{label}</label>
      {children}
    </div>
  );
}
