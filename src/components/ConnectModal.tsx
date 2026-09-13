import { useState, useEffect, FormEvent } from 'react';
import { useWallet } from '@/context/WalletContext';
import { KNOWN_WALLETS, WalletInfo, EIP6963ProviderDetail } from '@/lib/walletDiscovery';
import { Badge, Button, Input, Modal } from '@/components/ui';
import clsx from 'clsx';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'browser' | 'oms-email' | 'oms-agent';

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const { connect, sendOmsEmailOtp, verifyOmsOtp, createAgentSmartSession } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('browser');

  const [wallets, setWallets] = useState<WalletInfo[]>([]);

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dailyLimit, setDailyLimit] = useState<number>(100);
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [agentCreated, setAgentCreated] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const detectedMap = new Map<string, WalletInfo>();

    KNOWN_WALLETS.forEach((kw) => {
      const installed = kw.checkInstalled();
      detectedMap.set(kw.id, {
        id: kw.id,
        name: kw.name,
        rdns: kw.rdns,
        icon: kw.icon,
        installUrl: kw.installUrl,
        isInstalled: installed,
        provider: installed ? kw.getProvider() : undefined,
      });
    });

    const handleAnnounce = (event: Event) => {
      const customEvent = event as CustomEvent<EIP6963ProviderDetail>;
      const { info, provider } = customEvent.detail;

      const matched =
        KNOWN_WALLETS.find((w) => w.rdns === info.rdns) ||
        Array.from(detectedMap.values()).find((w) => w.name.toLowerCase() === info.name.toLowerCase());
      const walletId = matched ? matched.id : info.rdns || info.uuid || info.name.toLowerCase();

      detectedMap.set(walletId, {
        id: walletId,
        name: info.name,
        rdns: info.rdns,
        icon: info.icon || (matched ? matched.icon : 'W'),
        installUrl:
          matched ? matched.installUrl : 'https://google.com/search?q=' + encodeURIComponent(info.name + ' wallet extension'),
        isInstalled: true,
        provider,
      });

      setWallets(Array.from(detectedMap.values()));
    };

    window.addEventListener('eip6963:announceProvider', handleAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    setWallets(Array.from(detectedMap.values()));

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounce);
    };
  }, [isOpen]);

  async function handleWalletConnect(targetProvider?: any) {
    try {
      setLoading(true);
      setError(null);
      await connect(targetProvider);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail(e: FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendOmsEmailOtp(email);
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyOmsOtp(email, otpCode);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAgentSession(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createAgentSmartSession(dailyLimit, expiryDays);
      setAgentCreated(true);
      setTimeout(() => {
        setAgentCreated(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to create agent smart session.');
    } finally {
      setLoading(false);
    }
  }

  const installedWallets = wallets.filter((w) => w.isInstalled);
  const uninstalledWallets = wallets.filter((w) => !w.isInstalled);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'browser', label: 'Wallets' },
    { id: 'oms-email', label: 'Email OTP' },
    { id: 'oms-agent', label: 'Smart Session' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect wallet"
      description="Select a wallet or connect via Polygon OMS"
      size="md"
      className="max-w-[420px]"
    >
      <div className="mb-4 flex gap-1 rounded-2xl border border-line bg-paper p-1 text-xs font-medium shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setError(null);
            }}
            className={clsx(
              'flex-1 rounded-xl py-2 transition-colors duration-200',
              activeTab === tab.id ? 'bg-ink font-semibold text-white' : 'text-ink-soft hover:text-ink'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger-dim p-3 text-xs text-danger shrink-0">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {activeTab === 'browser' && (
          <div className="space-y-4">
            {installedWallets.length > 0 ? (
              <div className="space-y-1.5">
                <div className="label-caps mb-1.5 text-[10.5px]">Installed Wallets</div>
                {installedWallets.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleWalletConnect(w.provider)}
                    disabled={loading}
                    className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-line/80 bg-paper/60 p-3 transition-colors duration-200 hover:border-blue hover:bg-blue-dim/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-sm shadow-soft">
                        {w.icon.startsWith('data:') || w.icon.startsWith('http') ? (
                          <img src={w.icon} alt="" className="h-4 w-4 object-contain" />
                        ) : (
                          <span className="text-[10px] font-semibold tracking-tight text-ink">
                            {w.icon.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-ink transition-colors group-hover:text-blue">
                        {w.name}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      Connect →
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleWalletConnect()}
                disabled={loading}
                className="group flex w-full items-center justify-between rounded-2xl border border-line p-3 transition-colors duration-200 hover:bg-paper"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-dim text-[11px] font-semibold text-blue">
                    W3
                  </div>
                  <span className="text-sm font-medium text-ink group-hover:text-blue">Web3 Extension Provider</span>
                </div>
                <span className="text-xs font-semibold text-blue opacity-0 transition-opacity group-hover:opacity-100">
                  Connect →
                </span>
              </button>
            )}

            {uninstalledWallets.length > 0 && (
              <div className="border-t border-line pt-3">
                <div className="label-caps mb-2 text-[10.5px]">More Wallets</div>
                <div className="space-y-1.5">
                  {uninstalledWallets.map((w) => (
                    <a
                      key={w.id}
                      href={w.installUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-line/60 bg-paper/40 px-3 py-2 text-xs text-ink-soft transition-colors duration-200 hover:border-blue/30 hover:bg-blue-dim/20 hover:text-ink"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-[10px] font-semibold text-ink-soft shadow-soft">
                          {typeof w.icon === 'string' && !w.icon.startsWith('data:') && !w.icon.startsWith('http')
                            ? w.icon.slice(0, 2)
                            : 'W'}
                        </span>
                        <span className="font-medium text-ink truncate">{w.name}</span>
                      </div>
                      <span className="shrink-0 font-mono text-[10.5px] font-medium text-blue group-hover:underline">
                        Install ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'oms-email' && (
          <div>
            {step === 'email' ? (
              <form onSubmit={handleSendEmail} className="space-y-3.5 pt-1">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@polypaid.com"
                  required
                  autoComplete="email"
                />
                <Button type="submit" variant="ink" fullWidth disabled={loading}>
                  {loading ? 'Sending OTP…' : 'Continue with email OTP'}
                </Button>
                <p className="text-center font-mono text-[11px] text-ink-soft">
                  Creates a non-custodial EIP-7702 account
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5 pt-1">
                <div className="text-xs text-ink-soft">
                  Verification code sent to <b className="text-ink">{email}</b>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="ml-2 text-[11px] text-blue underline"
                  >
                    Edit
                  </button>
                </div>
                <Input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="text-center font-mono text-lg tracking-[0.3em]"
                  autoComplete="one-time-code"
                />
                <Button type="submit" variant="ink" fullWidth disabled={loading}>
                  {loading ? 'Verifying…' : 'Verify code'}
                </Button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'oms-agent' && (
          <div>
            {agentCreated ? (
              <div className="space-y-2 rounded-2xl bg-good-dim py-8 text-center text-good">
                <Badge tone="good" className="mx-auto">
                  Authorized
                </Badge>
                <div className="text-sm font-semibold">Smart session authorized</div>
              </div>
            ) : (
              <form onSubmit={handleCreateAgentSession} className="space-y-3 pt-1">
                <Input
                  label="Daily spending cap (USDC)"
                  type="number"
                  min={1}
                  max={10000}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="font-mono"
                />
                <Input
                  label="Duration (days)"
                  type="number"
                  min={1}
                  max={365}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="font-mono"
                />
                <Button type="submit" variant="ink" fullWidth disabled={loading} className="mt-2">
                  {loading ? 'Authorizing…' : 'Authorize smart session'}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
