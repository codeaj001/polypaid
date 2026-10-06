export interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on?(event: string, listener: (...args: any[]) => void): void;
  removeListener?(event: string, listener: (...args: any[]) => void): void;
  [key: string]: unknown;
}

export interface EIP6963ProviderDetail {
  info: {
    rdns: string;
    uuid: string;
    name: string;
    icon: string;
  };
  provider: EIP1193Provider;
}

export interface WalletInfo {
  id: string;
  name: string;
  rdns?: string;
  icon: string;
  provider: EIP1193Provider;
  source: 'eip6963' | 'legacy';
}

type BrowserWindow = Window & Record<string, any>;
type Subscriber = (wallets: WalletInfo[]) => void;

const announced = new Map<string, WalletInfo>();
const subscribers = new Set<Subscriber>();
let discoveryStarted = false;
let legacyTimer: number | undefined;

const KNOWN_METADATA: Array<{
  rdns: string[];
  name: string;
  icon: string;
  matches: (provider: EIP1193Provider) => boolean;
}> = [
  { rdns: ['io.rabby'], name: 'Rabby Wallet', icon: 'R', matches: (p) => Boolean(p.isRabby) },
  {
    rdns: ['com.coinbase.wallet'],
    name: 'Coinbase Wallet',
    icon: 'C',
    matches: (p) => Boolean(p.isCoinbaseWallet),
  },
  {
    rdns: ['com.trustwallet.app', 'app.trustwallet.com'],
    name: 'Trust Wallet',
    icon: 'T',
    matches: (p) => Boolean(p.isTrust || p.isTrustWallet),
  },
  { rdns: ['app.phantom'], name: 'Phantom', icon: 'P', matches: (p) => Boolean(p.isPhantom) },
  {
    rdns: ['com.okex.wallet', 'com.okx.wallet'],
    name: 'OKX Wallet',
    icon: 'O',
    matches: (p) => Boolean(p.isOkxWallet),
  },
  { rdns: ['me.rainbow'], name: 'Rainbow', icon: '🌈', matches: (p) => Boolean(p.isRainbow) },
  // Check MetaMask last because some injected wallets also expose isMetaMask.
  { rdns: ['io.metamask'], name: 'MetaMask', icon: 'M', matches: (p) => Boolean(p.isMetaMask) },
];

function snapshot(): WalletInfo[] {
  return Array.from(announced.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function notify() {
  const wallets = snapshot();
  subscribers.forEach((subscriber) => subscriber(wallets));
}

function isProvider(value: unknown): value is EIP1193Provider {
  return Boolean(value && typeof value === 'object' && typeof (value as EIP1193Provider).request === 'function');
}

function safeIcon(icon: unknown, fallback: string): string {
  if (typeof icon !== 'string' || icon.length > 100_000) return fallback;
  if (/^data:image\/(svg\+xml|png|webp|gif);/i.test(icon) || /^https:\/\//i.test(icon)) return icon;
  return fallback;
}

function metadataForProvider(provider: EIP1193Provider) {
  return KNOWN_METADATA.find((metadata) => metadata.matches(provider));
}

function handleAnnouncement(event: Event) {
  const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
  if (!detail?.info || !isProvider(detail.provider)) return;

  const { info, provider } = detail;
  if (!info.uuid || !info.name || !info.rdns) return;

  // UUID identifies an announced provider for this page lifetime. rdns is
  // self-attested metadata and is never used as a security decision.
  const known = KNOWN_METADATA.find((metadata) => metadata.rdns.includes(info.rdns));
  for (const [id, wallet] of announced) {
    if (wallet.source === 'legacy' && wallet.provider === provider) announced.delete(id);
  }

  announced.set(info.uuid, {
    id: info.uuid,
    name: info.name.trim().slice(0, 80),
    rdns: info.rdns.trim().slice(0, 255),
    icon: safeIcon(info.icon, known?.icon || info.name.trim().charAt(0).toUpperCase() || 'W'),
    provider,
    source: 'eip6963',
  });
  notify();
}

function collectLegacyProviders(browserWindow: BrowserWindow, existingProviders = new Set<EIP1193Provider>()): WalletInfo[] {
  const ethereum = browserWindow.ethereum;
  const candidates: unknown[] = [
    ...(Array.isArray(ethereum?.providers) ? ethereum.providers : [ethereum]),
    browserWindow.rabby,
    browserWindow.trustwallet,
    browserWindow.coinbaseWalletExtension,
    browserWindow.phantom?.ethereum,
    browserWindow.okxwallet,
  ];
  const unique = new Set<EIP1193Provider>();
  const wallets: WalletInfo[] = [];

  for (const candidate of candidates) {
    if (!isProvider(candidate) || unique.has(candidate) || existingProviders.has(candidate)) continue;
    unique.add(candidate);
    const metadata = metadataForProvider(candidate);
    const name = metadata?.name || 'Browser wallet';
    wallets.push({
      id: `legacy:${name}:${unique.size}`,
      name,
      icon: metadata?.icon || 'W',
      provider: candidate,
      source: 'legacy',
    });
  }
  return wallets;
}

function addLegacyProviders(browserWindow: BrowserWindow) {
  const existingProviders = new Set(snapshot().map((wallet) => wallet.provider));
  collectLegacyProviders(browserWindow, existingProviders).forEach((wallet) => announced.set(wallet.id, wallet));
  notify();
}

function startDiscovery() {
  if (discoveryStarted || typeof window === 'undefined') return;
  discoveryStarted = true;

  // EIP-6963 requires this listener to remain active for the page lifetime.
  window.addEventListener('eip6963:announceProvider', handleAnnouncement);
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  // EIP-1193 is a fallback for older extensions that do not announce through
  // EIP-6963. Waiting briefly prevents duplicate or incorrectly selected
  // window.ethereum entries when standards-compliant providers are present.
  legacyTimer = window.setTimeout(() => addLegacyProviders(window as BrowserWindow), 300);
}

export function subscribeToInstalledEvmWallets(subscriber: Subscriber): () => void {
  subscribers.add(subscriber);
  startDiscovery();
  subscriber(snapshot());
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  return () => subscribers.delete(subscriber);
}

export function refreshInstalledEvmWallets() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  if (legacyTimer !== undefined) window.clearTimeout(legacyTimer);
  legacyTimer = window.setTimeout(() => addLegacyProviders(window as BrowserWindow), 300);
}

export function discoverLegacyEvmWallets(browserWindow: BrowserWindow): WalletInfo[] {
  return collectLegacyProviders(browserWindow).sort((a, b) => a.name.localeCompare(b.name));
}
