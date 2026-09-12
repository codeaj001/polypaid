export type LinkStatus = 'open' | 'paid' | 'expired' | 'void';
export type PaymentStatus = 'pending' | 'routing' | 'confirmed' | 'failed' | 'refunded';

export interface PaymentLink {
  id: string;
  slug: string;
  creatorHandle: string;
  recipientAddress: string;
  amount: number;
  settlementToken: string;
  settlementChain: string;
  settlementChainId: number;
  memo: string;
  invoiceRef: string | null;
  redirectUrl: string | null;
  status: LinkStatus;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  linkId: string;
  payerAddress: string | null;
  originToken: string | null;
  originChainId: number | null;
  trailsIntentId: string | null;
  routeSummary: unknown;
  txHashDest: string | null;
  status: PaymentStatus;
  createdAt: string;
  confirmedAt: string | null;
}

export interface CreateLinkInput {
  amount: number;
  memo: string;
  invoiceRef?: string;
  recipientAddress?: string;
  expiresInDays?: number;
  redirectUrl?: string;
  creatorHandle?: string;
}

export interface DashboardStats {
  totalReceivedUsd: number;
  activeLinks: number;
  conversionRate: number;
  avgSettleSeconds: number;
}
