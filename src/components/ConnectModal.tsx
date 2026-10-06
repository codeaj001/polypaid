import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { KNOWN_WALLETS, WalletInfo, EIP6963ProviderDetail } from '@/lib/walletDiscovery';
import { isMobile, getWalletDeepLink } from '@/lib/mobile';
import { Modal } from '@/components/ui';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const { connect } = useWallet();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loadingWalletId, setLoadingWalletId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onMobileDevice = isMobile();

  useEffect(() => {
    if (!isOpen) return;

    const detected = new Map<string, WalletInfo>();
    KNOWN_WALLETS.forEach((wallet) => {
      const installed = wallet.checkInstalled();
      detected.set(wallet.id, {
        id: wallet.id,
        name: wallet.name,
        rdns: wallet.rdns,
        icon: wallet.icon,
        installUrl: wallet.installUrl,
        isInstalled: installed,
        provider: installed ? wallet.getProvider() : undefined,
      });
    });

    const refresh = () => setWallets(Array.from(detected.values()));
    const handleAnnounce = (event: Event) => {
      const { info, provider } = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      const known = KNOWN_WALLETS.find((wallet) => wallet.rdns === info.rdns);
      const id = known?.id || info.rdns || info.uuid;
      detected.set(id, {
        id,
        name: info.name,
        rdns: info.rdns,
        icon: info.icon || known?.icon || 'W',
        installUrl: known?.installUrl || `https://www.google.com/search?q=${encodeURIComponent(`${info.name} wallet`)}`,
        isInstalled: true,
        provider,
      });
      refresh();
    };

    window.addEventListener('eip6963:announceProvider', handleAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    refresh();
    return () => window.removeEventListener('eip6963:announceProvider', handleAnnounce);
  }, [isOpen]);

  async function selectWallet(wallet: WalletInfo) {
    setError(null);
    if (!wallet.isInstalled || !wallet.provider) {
      if (onMobileDevice) {
        window.location.href = getWalletDeepLink(wallet.id);
      } else {
        window.open(wallet.installUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect wallet"
      description={onMobileDevice ? 'Open this payment in a supported wallet app.' : 'Select an installed wallet or install one to continue.'}
      size="md"
      className="max-w-[420px]"
    >
      {error && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger-dim p-3 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            type="button"
            disabled={loadingWalletId !== null}
            onClick={() => selectWallet(wallet)}
            className="group flex w-full items-center justify-between rounded-2xl border border-line/80 bg-paper/60 p-3 transition-all duration-200 hover:border-blue hover:bg-blue-dim/40 disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface shadow-soft">
                {wallet.icon.startsWith('data:') || wallet.icon.startsWith('http') ? (
                  <img src={wallet.icon} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  <span className="font-semibold">{wallet.icon}</span>
                )}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-ink group-hover:text-blue">{wallet.name}</div>
                <div className="text-[11px] text-ink-soft">
                  {wallet.isInstalled ? 'Detected' : onMobileDevice ? 'Open wallet app' : 'Not installed'}
                </div>
              </div>
            </div>
            <span className="font-mono text-xs font-semibold text-blue">
              {loadingWalletId === wallet.id ? 'Connecting…' : wallet.isInstalled ? 'Connect →' : onMobileDevice ? 'Open ↗' : 'Install ↗'}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-center font-mono text-[10.5px] leading-relaxed text-ink-soft">
        Email OTP and smart-session login are unavailable until a production wallet provider is connected.
      </p>
    </Modal>
  );
}
