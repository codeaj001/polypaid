import { PaymentLink } from './types';

export interface X402PaymentSpec {
  x402Version: string;
  scheme: 'exact';
  network: 'polygon';
  chainId: number;
  recipient: string;
  amount: number;
  settlementToken: string;
  settlementTokenContract: string;
  memo: string;
  invoiceRef: string | null;
  expiresAt: string | null;
  supportedOriginChains: string[];
  trailsIntentRequired: boolean;
}

export const POLYGON_USDC_MAINNET = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

export function buildX402Spec(link: PaymentLink): X402PaymentSpec {
  return {
    x402Version: '1.0.0',
    scheme: 'exact',
    network: 'polygon',
    chainId: link.settlementChainId || 137,
    recipient: link.recipientAddress,
    amount: link.amount,
    settlementToken: link.settlementToken || 'USDC',
    settlementTokenContract: POLYGON_USDC_MAINNET,
    memo: link.memo,
    invoiceRef: link.invoiceRef,
    expiresAt: link.expiresAt,
    supportedOriginChains: ['ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'avalanche', 'bsc'],
    trailsIntentRequired: true,
  };
}

export function buildHTTP402Header(link: PaymentLink): string {
  const spec = buildX402Spec(link);
  return `X-402-Payment-Required amount=${spec.amount}, currency=${spec.settlementToken}, chain=${spec.network}, recipient=${spec.recipient}`;
}
