/**
 * Data-access layer for PolyPaid.
 */
import { getSupabaseClient } from './supabase-client';
import { generateSlug } from './slug';
import { CreateLinkInput, DashboardStats, PaymentLink, Payment } from './types';
import { isEvmAddress } from '@/context/WalletContext';
import * as local from './store.local';

function rowToLink(row: any): PaymentLink {
  return {
    id: row.id,
    slug: row.slug,
    creatorHandle: row.creator_handle ?? 'you',
    recipientAddress: row.recipient_address,
    amount: Number(row.amount),
    settlementToken: row.settlement_token,
    settlementChain: row.settlement_chain,
    settlementChainId: row.settlement_chain_id,
    memo: row.memo,
    invoiceRef: row.invoice_ref,
    redirectUrl: row.redirect_url,
    status: row.status,
    expiresAt: row.expires_at,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}

export async function createLink(input: CreateLinkInput): Promise<PaymentLink> {
  const recipientAddress = input.recipientAddress || import.meta.env.VITE_DEFAULT_RECIPIENT_ADDRESS;
  if (!recipientAddress || !isEvmAddress(recipientAddress)) {
    throw new Error('Payment links settle in Polygon USDC and require a valid Polygon EVM address starting with 0x.');
  }

  const sb = getSupabaseClient();
  if (!sb) return local.localCreateLink(input);

  const slug = generateSlug(input.memo, input.creatorHandle);
  try {
    const { data, error } = await sb
      .from('payment_links')
      .insert({
        slug,
        recipient_address: recipientAddress,
        amount: input.amount,
        memo: input.memo,
        invoice_ref: input.invoiceRef ?? null,
        redirect_url: input.redirectUrl ?? null,
        expires_at: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert error, falling back to local store:', error.message);
      return local.localCreateLink(input);
    }
    return rowToLink(data);
  } catch (err: any) {
    console.warn('Supabase createLink failed (network/CORS error), falling back to local store:', err);
    return local.localCreateLink(input);
  }
}

export async function getLinkBySlug(slug: string): Promise<PaymentLink | null> {
  const sb = getSupabaseClient();
  if (!sb) return local.localGetLinkBySlug(slug);

  try {
    const { data, error } = await sb.from('payment_links').select('*').eq('slug', slug).single();
    if (error || !data) return local.localGetLinkBySlug(slug);
    return rowToLink(data);
  } catch (err) {
    console.warn('Supabase getLinkBySlug failed, falling back to local store:', err);
    return local.localGetLinkBySlug(slug);
  }
}

export async function listLinks(userAddress?: string | null): Promise<PaymentLink[]> {
  const sb = getSupabaseClient();
  if (!sb) return local.localListLinks(userAddress);

  try {
    let query = sb.from('payment_links').select('*');
    if (userAddress) {
      query = query.ilike('recipient_address', userAddress);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return local.localListLinks(userAddress);

    // Merge remote database links with any locally created links
    const localLinks = await local.localListLinks(userAddress);
    const combined = data.map(rowToLink);
    localLinks.forEach((l) => {
      if (!combined.some((c) => c.slug === l.slug || c.id === l.id)) {
        combined.push(l);
      }
    });
    return combined;
  } catch (err) {
    console.warn('Supabase listLinks failed, falling back to local store:', err);
    return local.localListLinks(userAddress);
  }
}

export async function recordAttempt(linkId: string, payerAddress: string, trailsIntentId: string): Promise<Payment | null> {
  const sb = getSupabaseClient();
  if (!sb) return local.localRecordAttempt(linkId, payerAddress, trailsIntentId);

  try {
    const { data, error } = await sb
      .from('payments')
      .insert({ link_id: linkId, payer_address: payerAddress, trails_intent_id: trailsIntentId })
      .select()
      .single();
    if (error) {
      console.warn('Supabase recordAttempt error, using local fallback:', error.message);
      return local.localRecordAttempt(linkId, payerAddress, trailsIntentId);
    }
    return data as unknown as Payment;
  } catch (err) {
    console.warn('Supabase recordAttempt failed, using local fallback:', err);
    return local.localRecordAttempt(linkId, payerAddress, trailsIntentId);
  }
}

export async function markPaidByIntentOptimistic(intentId: string, destTxHash: string, routeSummary: unknown): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return local.localMarkPaidByIntent(intentId, destTxHash, routeSummary);

  try {
    const { error } = await sb.rpc('confirm_payment_intent', {
      p_intent_id: intentId,
      p_tx_hash: destTxHash,
      p_route_summary: routeSummary,
    });

    if (error) {
      const { data: payment } = await sb
        .from('payments')
        .update({ status: 'confirmed', tx_hash_dest: destTxHash, route_summary: routeSummary, confirmed_at: new Date().toISOString() })
        .eq('trails_intent_id', intentId)
        .select('link_id')
        .maybeSingle();

      if (payment?.link_id) {
        await sb.from('payment_links').update({ status: 'paid' }).eq('id', payment.link_id);
      }
    }
  } catch (err) {
    console.warn('Supabase markPaidByIntentOptimistic failed, using local fallback:', err);
    await local.localMarkPaidByIntent(intentId, destTxHash, routeSummary);
  }
}

export async function getStats(userAddress?: string | null): Promise<DashboardStats> {
  const sb = getSupabaseClient();
  if (!sb) return local.localGetStats(userAddress);

  try {
    let query = sb.from('payment_links').select('id, amount, status, recipient_address');
    if (userAddress) {
      query = query.ilike('recipient_address', userAddress);
    }
    const { data: links, error: lErr } = await query;
    const { data: payments, error: pErr } = await sb.from('payments').select('status, link_id');

    if (lErr || pErr || !links) return local.localGetStats(userAddress);

    const linkRows = links ?? [];
    const paymentRows = payments ?? [];
    const confirmed = paymentRows.filter((p: any) => p.status === 'confirmed');
    const totalReceivedUsd = confirmed.reduce((sum: number, p: any) => {
      const link = linkRows.find((l: any) => l.id === p.link_id);
      return sum + Number(link?.amount ?? 0);
    }, 0);

    return {
      totalReceivedUsd,
      activeLinks: linkRows.filter((l: any) => l.status === 'open').length,
      conversionRate: linkRows.length
        ? Math.round((linkRows.filter((l: any) => l.status === 'paid').length / linkRows.length) * 100)
        : 0,
      avgSettleSeconds: 0,
    };
  } catch (err) {
    console.warn('Supabase getStats failed, using local fallback:', err);
    return local.localGetStats(userAddress);
  }
}

export function isUsingLocalStore(): boolean {
  return getSupabaseClient() === null;
}
