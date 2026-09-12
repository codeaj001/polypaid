export interface WalletInfo {
  id: string;
  name: string;
  rdns?: string;
  icon: string;
  installUrl: string;
  isInstalled: boolean;
  provider?: any;
}

export interface EIP6963ProviderDetail {
  info: {
    rdns: string;
    uuid: string;
    name: string;
    icon: string;
  };
  provider: any;
}

// Official SVG Data URIs for wallets
const METAMASK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="%23E17726" d="M30 6L18.4 14.5l3.2-7.6z"/><path fill="%23E27625" d="M2 6l11.4 8.5-3.1-7.6z"/><path fill="%23D7C1B3" d="M24.7 21.6l-2.9 4.4 6-2.2zM7.3 21.6l2.9 4.4-6-2.2z"/><path fill="%23231F20" d="M11 25.8l-4.4.8 3.5 2.8zm10 0l4.4.8-3.5 2.8z"/><path fill="%23D7C1B3" d="M10.1 29.4l4.6-2.2-4-3.1zm11.8 0l-4.6-2.2 4-3.1z"/><path fill="%23E4761B" d="M16 23l-3.9-3 2.8 5.6zm0 0l3.9-3-2.8 5.6z"/></svg>`;
const TRUST_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="%230500FF" d="M16 3L4 7v10c0 7.5 5.2 14 12 16 6.8-2 12-8.5 12-16V7L16 3z"/><path fill="%23FFF" d="M16 7L7 10v7c0 5.5 3.8 10.3 9 11.8 5.2-1.5 9-6.3 9-11.8v-7L16 7z"/></svg>`;
const PHANTOM_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%23AB9FF2"/><path fill="%23FFF" d="M24 16c0-4.4-3.6-8-8-8s-8 3.6-8 8c0 3.8 2.7 7 6.3 7.8v-3.8c0-.6.4-1 1-1s1 .4 1 1v3.8c3.6-.8 6.3-4 6.3-7.8z"/><circle cx="13" cy="15" r="1.5" fill="%23AB9FF2"/><circle cx="19" cy="15" r="1.5" fill="%23AB9FF2"/></svg>`;
const SOLFLARE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%23111"/><path fill="url(%23sf)" d="M16 4L6 14l10 10 10-10L16 4z"/><defs><linearGradient id="sf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23F39C12"/><stop offset="100%" stop-color="%239B59B6"/></linearGradient></defs></svg>`;
const RABBY_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%2386A4F8"/><path fill="%23FFF" d="M16 8c-3.3 0-6 2.7-6 6v4c0 3.3 2.7 6 6 6s6-2.7 6-6v-4c0-3.3-2.7-6-6-6z"/></svg>`;
const COINBASE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%230052FF"/><path fill="%23FFF" d="M16 6a10 10 0 100 20 10 10 0 000-20zm-4 7h8v6h-8v-6z"/></svg>`;
const RAINBOW_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%23000"/><path fill="%23FF4B4B" d="M6 22a10 10 0 0120 0h-4a6 6 0 00-12 0H6z"/><path fill="%23FFB800" d="M10 22a6 6 0 0112 0h-3a3 3 0 00-6 0h-3z"/></svg>`;
const OKX_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%23000"/><rect x="8" y="8" width="5" height="5" fill="%23FFF"/><rect x="19" y="8" width="5" height="5" fill="%23FFF"/><rect x="13.5" y="13.5" width="5" height="5" fill="%23FFF"/><rect x="8" y="19" width="5" height="5" fill="%23FFF"/><rect x="19" y="19" width="5" height="5" fill="%23FFF"/></svg>`;

export const KNOWN_WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    rdns: 'io.metamask',
    icon: METAMASK_SVG,
    installUrl: 'https://metamask.io/download/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      const eth = (window as any).ethereum;
      return Boolean(eth?.isMetaMask && !eth?.isRabby && !eth?.isTrust);
    },
    getProvider: () => {
      const eth = (window as any).ethereum;
      if (eth?.providers) {
        return eth.providers.find((p: any) => p.isMetaMask && !p.isRabby && !p.isTrust) || eth;
      }
      return eth;
    },
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    rdns: 'io.rabby',
    icon: RABBY_SVG,
    installUrl: 'https://rabby.io/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      return Boolean((window as any).rabby || (window as any).ethereum?.isRabby);
    },
    getProvider: () => (window as any).rabby || (window as any).ethereum,
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    rdns: 'app.trustwallet.com',
    icon: TRUST_SVG,
    installUrl: 'https://trustwallet.com/browser-extension',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      return Boolean((window as any).trustwallet || (window as any).ethereum?.isTrust);
    },
    getProvider: () => {
      if ((window as any).trustwallet) return (window as any).trustwallet;
      const eth = (window as any).ethereum;
      if (eth?.providers) {
        return eth.providers.find((p: any) => p.isTrust) || eth;
      }
      return eth;
    },
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    rdns: 'com.coinbase.wallet',
    icon: COINBASE_SVG,
    installUrl: 'https://www.coinbase.com/wallet',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      return Boolean((window as any).coinbaseWalletExtension || (window as any).ethereum?.isCoinbaseWallet);
    },
    getProvider: () => (window as any).coinbaseWalletExtension || (window as any).ethereum,
  },
  {
    id: 'phantom',
    name: 'Phantom (Solana & EVM)',
    rdns: 'app.phantom',
    icon: PHANTOM_SVG,
    installUrl: 'https://phantom.app/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      return Boolean(
        (window as any).phantom?.ethereum ||
          (window as any).ethereum?.isPhantom ||
          (window as any).phantom?.solana ||
          (window as any).solana
      );
    },
    getProvider: () =>
      (window as any).phantom?.ethereum ||
      (window as any).ethereum ||
      (window as any).phantom?.solana ||
      (window as any).solana,
  },
  {
    id: 'solflare',
    name: 'Solflare (Solana)',
    rdns: 'com.solflare',
    icon: SOLFLARE_SVG,
    installUrl: 'https://solflare.com/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      return Boolean((window as any).solflare?.isSolflare || (window as any).solflare);
    },
    getProvider: () => (window as any).solflare,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    rdns: 'me.rainbow',
    icon: RAINBOW_SVG,
    installUrl: 'https://rainbow.me/',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      return Boolean((window as any).rainbow || (window as any).ethereum?.isRainbow);
    },
    getProvider: () => (window as any).rainbow || (window as any).ethereum,
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    rdns: 'com.okex.wallet',
    icon: OKX_SVG,
    installUrl: 'https://www.okx.com/web3',
    checkInstalled: () => {
      if (typeof window === 'undefined') return false;
      return Boolean((window as any).okxwallet || (window as any).ethereum?.isOkxWallet);
    },
    getProvider: () => (window as any).okxwallet || (window as any).ethereum,
  },
];
