import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client using the anon key only (safe to ship — Vite
 * bakes VITE_-prefixed vars into the client bundle). Row Level Security
 * policies in supabase/schema.sql are what actually keep this safe:
 * public read on payment_links, but only a trusted service (never this
 * browser client) can mark a payment confirmed. See server/README.md.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}
