/**
 * Mobile detection & Universal Deep Link helper utilities for PolyPaid.
 */

export function isMobile(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const eth = (window as any).ethereum;
  const sol = (window as any).solana;
  return Boolean(
    eth?.isMetaMask ||
      eth?.isTrust ||
      eth?.isCoinbaseWallet ||
      eth?.isRabby ||
      eth?.isPhantom ||
      sol?.isPhantom ||
      sol?.isSolflare
  );
}

/**
 * Returns the Universal Link / Deep Link URL to open a dApp URL inside a native mobile wallet app.
 */
export function getWalletDeepLink(walletId: string, rawUrl?: string): string {
  const currentUrl = rawUrl || (typeof window !== 'undefined' ? window.location.href : 'https://polypaid.vercel.app');
  // Strip protocol for dapps that require hostname/path without https://
  const cleanUrl = currentUrl.replace(/^https?:\/\//, '');
  const encodedFullUrl = encodeURIComponent(currentUrl);

  switch (walletId) {
    case 'metamask':
      // MetaMask Mobile Deep Link format: https://metamask.app.link/dapp/polypaid.vercel.app/...
      return `https://metamask.app.link/dapp/${cleanUrl}`;

    case 'phantom':
      // Phantom Mobile Deep Link format: https://phantom.app/ul/browse/https%3A%2F%2Fpolypaid.vercel.app
      return `https://phantom.app/ul/browse/${encodedFullUrl}?ref=${encodeURIComponent(currentUrl)}`;

    case 'trust':
      // Trust Wallet Deep Link format: https://link.trustwallet.com/open_url?url=https%3A%2F%2Fpolypaid.vercel.app
      return `https://link.trustwallet.com/open_url?coin_id=60&url=${encodedFullUrl}`;

    case 'coinbase':
      // Coinbase Wallet Deep Link format: https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Fpolypaid.vercel.app
      return `https://go.cb-w.com/dapp?cb_url=${encodedFullUrl}`;

    case 'rainbow':
      // Rainbow Mobile Deep Link format: https://rainbow.me/open?url=https%3A%2F%2Fpolypaid.vercel.app
      return `https://rainbow.me/open?url=${encodedFullUrl}`;

    case 'solflare':
      // Solflare Mobile Deep Link format: https://solflare.com/ul/v1/browse/https%3A%2F%2Fpolypaid.vercel.app
      return `https://solflare.com/ul/v1/browse/${encodedFullUrl}`;

    case 'okx':
      // OKX Wallet Deep Link format
      return `https://www.okx.com/download?deeplink=${encodeURIComponent(`okx://wallet/dapp/details?dappUrl=${encodedFullUrl}`)}`;

    default:
      return `https://metamask.app.link/dapp/${cleanUrl}`;
  }
}
