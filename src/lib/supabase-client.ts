import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client using the anon key only (safe to ship — Vite
 * bakes VITE_-prefixed vars into the client bundle). Row Level Security
 * policies in supabase/schema.sql are the security boundary. Only a trusted
 * backend service may verify settlement and mark a payment confirmed.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

export function requireSupabaseClient(): SupabaseClient {
  const configuredClient = getSupabaseClient();
  if (!configuredClient) {
    throw new Error('PolyPaid is not configured. Add the Supabase URL and anon key before using the app.');
  }
  return configuredClient;
}
