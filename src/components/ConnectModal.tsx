import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import {
  refreshInstalledEvmWallets,
  subscribeToInstalledEvmWallets,
  WalletInfo,
} from '@/lib/walletDiscovery';
import { Modal } from '@/components/ui';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const { connect } = useWallet();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(true);
  const [loadingWalletId, setLoadingWalletId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDetecting(true);
    setError(null);
    setQuery('');

    const unsubscribe = subscribeToInstalledEvmWallets((detected) => {
      setWallets(detected);
      if (detected.length > 0) setDetecting(false);
    });
    const detectionWindow = window.setTimeout(() => setDetecting(false), 500);
    refreshInstalledEvmWallets();

    return () => {
      unsubscribe();
      window.clearTimeout(detectionWindow);
    };
  }, [isOpen]);

  const filteredWallets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return wallets;
    return wallets.filter(
      (wallet) => wallet.name.toLowerCase().includes(normalized) || wallet.rdns?.toLowerCase().includes(normalized)
    );
  }, [query, wallets]);

  async function selectWallet(wallet: WalletInfo) {
    setError(null);
    setLoadingWalletId(wallet.id);
    try {
      await connect(wallet.provider);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Wallet connection failed.');
    } finally {
      setLoadingWalletId(null);
    }
  }

  function refresh() {
    setDetecting(true);
    setError(null);
    refreshInstalledEvmWallets();
    window.setTimeout(() => setDetecting(false), 500);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect wallet"
      description="Installed Polygon-compatible browser wallets are detected automatically."
      size="md"
      className="max-w-[420px]"
    >
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger-dim p-3 text-xs text-danger">
          {error}
        </div>
      )}

      {wallets.length > 1 && (
        <label className="mb-3 block">
          <span className="sr-only">Filter installed wallets</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter installed wallets…"
            autoComplete="off"
            className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-blue"
          />
        </label>
      )}

      <div className="space-y-1.5" aria-live="polite">
        {filteredWallets.map((wallet) => (
          <button
            key={wallet.id}
            type="button"
            disabled={loadingWalletId !== null}
            onClick={() => selectWallet(wallet)}
            className="group flex w-full items-center justify-between rounded-2xl border border-line/80 bg-paper/60 p-3 transition-all duration-200 hover:border-blue hover:bg-blue-dim/40 disabled:opacity-60"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
                {wallet.icon.startsWith('data:image/') || wallet.icon.startsWith('https://') ? (
                  <img src={wallet.icon} alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <span className="font-semibold">{wallet.icon}</span>
                )}
              </div>
              <div className="min-w-0 text-left">
                <div className="truncate text-sm font-semibold text-ink group-hover:text-blue">{wallet.name}</div>
                <div className="truncate text-[11px] text-ink-soft">
                  {wallet.rdns || 'Legacy browser provider'} · Installed
                </div>
              </div>
            </div>
            <span className="ml-3 shrink-0 font-mono text-xs font-semibold text-blue">
              {loadingWalletId === wallet.id ? 'Connecting…' : 'Connect →'}
            </span>
          </button>
        ))}

        {!detecting && wallets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-paper/50 px-5 py-7 text-center">
            <div className="text-sm font-semibold text-ink">No compatible browser wallet detected</div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              Install or enable an EVM wallet extension, allow it on this site, then refresh detection.
            </p>
            <button type="button" onClick={refresh} className="mt-4 text-xs font-semibold text-blue hover:underline">
              Detect again
            </button>
          </div>
        )}

        {!detecting && wallets.length > 0 && filteredWallets.length === 0 && (
          <div className="rounded-xl border border-line bg-paper p-4 text-center text-xs text-ink-soft">
            No installed wallet matches “{query}”.
          </div>
        )}

        {detecting && wallets.length === 0 && (
          <div className="rounded-2xl border border-line bg-paper p-6 text-center text-sm text-ink-soft">
            Detecting installed wallets…
          </div>
        )}
      </div>

      <p className="mt-4 text-center font-mono text-[10.5px] leading-relaxed text-ink-soft">
        Detection uses EIP-6963 with a legacy EIP-1193 fallback. Connecting always requires your approval.
      </p>
    </Modal>
  );
}
