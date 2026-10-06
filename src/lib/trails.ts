/**
 * Trails (0xtrails) configuration + Polygon Open Money Stack (OMS) primitives.
 * Get an API key from https://dashboard.trails.build and set
 * VITE_TRAILS_API_KEY in .env.local. Until then, <TrailsPayWidget />
 * payments fail closed when the official SDK is unavailable.
 */
export const TRAILS_API_KEY = import.meta.env.VITE_TRAILS_API_KEY ?? '';

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_AMOY_CHAIN_ID = 80002;
export const USDC_POLYGON_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

export function isTrailsConfigured(): boolean {
  return TRAILS_API_KEY.length > 0;
}

export function getPolygonscanTxUrl(txHash: string): string {
  return `https://polygonscan.com/tx/${txHash}`;
}
