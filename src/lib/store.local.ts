/**
 * localStorage-backed data store — client-side persistence for real payment links and payments.
 */
import { PaymentLink, Payment, CreateLinkInput, DashboardStats } from './types';
import { generateSlug } from './slug';
import { isEvmAddress } from '@/context/WalletContext';

const LINKS_KEY = 'polypay:links';
const PAYMENTS_KEY = 'polypay:payments';

function ensureStorageInitialized() {
  if (!localStorage.getItem(LINKS_KEY)) {
    localStorage.setItem(LINKS_KEY, JSON.stringify([]));
  } else {
    // Purge residual demo data if present from earlier dev sessions
    try {
      const existing: PaymentLink[] = JSON.parse(localStorage.getItem(LINKS_KEY) || '[]');
      const hasDemoLink = existing.some(
        (l) => l.slug.includes('studio-eth') || l.slug.includes('dao-contributor') || l.invoiceRef === 'INV-0842'
      );
      if (hasDemoLink) {
        localStorage.setItem(LINKS_KEY, JSON.stringify([]));
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify([]));
      }
    } catch (e) {
      localStorage.setItem(LINKS_KEY, JSON.stringify([]));
    }
  }

  if (!localStorage.getItem(PAYMENTS_KEY)) {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify([]));
  }
}

function readLinks(): PaymentLink[] {
  ensureStorageInitialized();
  return JSON.parse(localStorage.getItem(LINKS_KEY) ?? '[]');
}

function writeLinks(links: PaymentLink[]) {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

function readPayments(): Payment[] {
  ensureStorageInitialized();
  return JSON.parse(localStorage.getItem(PAYMENTS_KEY) ?? '[]');
}

function writePayments(payments: Payment[]) {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export async function localCreateLink(input: CreateLinkInput): Promise<PaymentLink> {
  const recipientAddress = input.recipientAddress || import.meta.env.VITE_DEFAULT_RECIPIENT_ADDRESS;
  if (!recipientAddress || !isEvmAddress(recipientAddress)) {
    throw new Error('Payment links settle in Polygon USDC and require a valid Polygon EVM address starting with 0x.');
  }

  const link: PaymentLink = {
    id: `link_${Math.random().toString(36).slice(2, 9)}`,
    slug: generateSlug(input.memo, input.creatorHandle),
    creatorHandle: input.creatorHandle ?? 'you',
    recipientAddress,
    amount: input.amount,
    settlementToken: 'USDC',
    settlementChain: 'polygon',
    settlementChainId: 137,
    memo: input.memo,
    invoiceRef: input.invoiceRef ?? null,
    redirectUrl: input.redirectUrl ?? null,
    status: 'open',
    expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString() : null,
    viewCount: 0,
    createdAt: new Date().toISOString(),
  };
  const links = readLinks();
  links.unshift(link);
  writeLinks(links);
  return link;
}

export async function localGetLinkBySlug(slug: string): Promise<PaymentLink | null> {
  const links = readLinks();
  const link = links.find((l) => l.slug === slug) ?? null;
  if (link) {
    link.viewCount += 1;
    writeLinks(links);
  }
  return link ? { ...link } : null;
}

export async function localListLinks(userAddress?: string | null): Promise<PaymentLink[]> {
  const allLinks = readLinks();
  if (userAddress) {
    const cleanAddr = userAddress.toLowerCase();
    return allLinks
      .filter((l) => l.recipientAddress.toLowerCase() === cleanAddr)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return [...allLinks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function localRecordAttempt(linkId: string, payerAddress: string, trailsIntentId: string): Promise<Payment> {
  const payment: Payment = {
    id: `pay_${Math.random().toString(36).slice(2, 9)}`,
    linkId,
    payerAddress,
    originToken: null,
    originChainId: null,
    trailsIntentId,
    routeSummary: null,
    txHashDest: null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    confirmedAt: null,
  };
  const payments = readPayments();
  payments.unshift(payment);
  writePayments(payments);
  return payment;
}

export async function localMarkPaidByIntent(intentId: string, destTxHash: string, routeSummary: unknown): Promise<void> {
  const payments = readPayments();
  const payment = payments.find((p) => p.trailsIntentId === intentId);
  if (payment) {
    payment.status = 'confirmed';
    payment.txHashDest = destTxHash;
    payment.routeSummary = routeSummary;
    payment.confirmedAt = new Date().toISOString();
    writePayments(payments);
  }

  const links = readLinks();
  const link = links.find((l) => l.id === payment?.linkId);
  if (link) {
    link.status = 'paid';
    writeLinks(links);
  }
}

export async function localGetStats(userAddress?: string | null): Promise<DashboardStats> {
  const links = await localListLinks(userAddress);
  const payments = readPayments();
  const confirmed = payments.filter((p) => p.status === 'confirmed');
  const totalReceivedUsd = confirmed.reduce((sum, p) => {
    const link = links.find((l) => l.id === p.linkId);
    return sum + (link?.amount ?? 0);
  }, 0);

  return {
    totalReceivedUsd,
    activeLinks: links.filter((l) => l.status === 'open').length,
    conversionRate: links.length ? Math.round((links.filter((l) => l.status === 'paid').length / links.length) * 100) : 0,
    avgSettleSeconds: 0,
  };
}

export function resetLocalStore() {
  localStorage.removeItem(LINKS_KEY);
  localStorage.removeItem(PAYMENTS_KEY);
}
