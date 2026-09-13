import { useState, useEffect, FormEvent } from 'react';
import { useWallet } from '@/context/WalletContext';
import { KNOWN_WALLETS, WalletInfo, EIP6963ProviderDetail } from '@/lib/walletDiscovery';
import { isMobile, isInAppBrowser, getWalletDeepLink } from '@/lib/mobile';
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

  const onMobileDevice = isMobile();

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
    { id: 'browser', label: onMobileDevice ? 'Mobile Apps' : 'Wallets' },
    { id: 'oms-email', label: 'Email OTP' },
    { id: 'oms-agent', label: 'Smart Session' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect wallet"
      description={onMobileDevice ? 'Open in mobile app or connect via Email OTP' : 'Select a wallet or connect via Polygon OMS'}
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
          <div className="space-y-3">
            {onMobileDevice && (
              <div className="rounded-xl border border-blue-mid/40 bg-blue-dim/50 px-3.5 py-2.5 text-xs text-blue">
                Tap any wallet below to open it on your mobile device, or use <b>Email OTP</b> for 1-tap web login.
              </div>
            )}

            <div className="space-y-1.5">
              <div className="label-caps mb-1.5 text-[10.5px]">
                {onMobileDevice ? 'Select Mobile Wallet' : 'Detected & Supported Wallets'}
              </div>

              {wallets.map((w) => {
                const deepLink = getWalletDeepLink(w.id);
                const isDetected = w.isInstalled;

                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      if (isDetected && w.provider) {
                        handleWalletConnect(w.provider);
                      } else if (onMobileDevice) {
                        window.location.href = deepLink;
                      } else {
                        window.open(w.installUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    disabled={loading}
                    className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-line/80 bg-paper/60 p-3 transition-all duration-200 hover:border-blue hover:bg-blue-dim/40 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface shadow-soft">
                        {w.icon.startsWith('data:') || w.icon.startsWith('http') ? (
                          <img src={w.icon} alt="" className="h-4.5 w-4.5 object-contain" />
                        ) : (
                          <span className="text-[11px] font-semibold tracking-tight text-ink">
                            {w.icon.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-ink transition-colors group-hover:text-blue">
                          {w.name}
                        </div>
                        {onMobileDevice && !isDetected && (
                          <div className="text-[11px] text-ink-soft">Tap to launch app</div>
                        )}
                      </div>
                    </div>

                    <span className="flex items-center gap-1 font-mono text-xs font-semibold text-blue opacity-90 transition-opacity duration-200 group-hover:opacity-100">
                      {isDetected ? 'Connect →' : onMobileDevice ? 'Open App ↗' : 'Install ↗'}
                    </span>
                  </button>
                );
              })}
            </div>
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
