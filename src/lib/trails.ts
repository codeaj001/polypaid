/**
 * Trails (0xtrails) configuration + Polygon Open Money Stack (OMS) primitives.
 * Get an API key from https://dashboard.trails.build and set
 * VITE_TRAILS_API_KEY in .env.local. Until then, <TrailsPayWidget />
 * automatically falls back to a fully interactive on-brand mock.
 */
export const TRAILS_API_KEY = import.meta.env.VITE_TRAILS_API_KEY ?? '';

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_AMOY_CHAIN_ID = 80002;
export const USDC_POLYGON_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

export const SUPPORTED_ORIGIN_TOKENS = [
  { symbol: 'SOL', chain: 'Solana', chainId: 900, isSolana: true },
  { symbol: 'ETH', chain: 'Base', chainId: 8453 },
  { symbol: 'USDT', chain: 'Arbitrum', chainId: 42161 },
  { symbol: 'DAI', chain: 'Ethereum', chainId: 1 },
  { symbol: 'POL', chain: 'Polygon', chainId: 137 },
  { symbol: 'USDC', chain: 'Optimism', chainId: 10 },
  { symbol: 'AVAX', chain: 'Avalanche', chainId: 43114 },
  { symbol: 'BNB', chain: 'BNB Chain', chainId: 56 },
] as const;

export const POLYGON_OMS_PRIMITIVES = {
  moneyMovement: ['Instant Cross-Chain Swap', 'CCTP Circle Bridging', 'Gasless Intent Execution'],
  settlementAsset: 'USDC on Polygon (Native)',
  executionEngine: 'Trails Solver Network',
};

export function isTrailsConfigured(): boolean {
  return TRAILS_API_KEY.length > 0;
}

export function getPolygonscanTxUrl(txHash: string): string {
  return `https://polygonscan.com/tx/${txHash}`;
}
