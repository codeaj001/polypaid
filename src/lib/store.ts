/**
 * Data-access layer for PolyPaid.
 */
import { requireSupabaseClient } from './supabase-client';
import { generateSlug } from './slug';
import { CreateLinkInput, DashboardStats, PaymentLink } from './types';
import { isEvmAddress } from '@/context/WalletContext';

function rowToLink(row: any): PaymentLink {
  return {
    id: row.id,
    slug: row.slug,
    creatorHandle: row.creator_handle ?? 'merchant',
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
  const recipientAddress = input.recipientAddress;
  if (!recipientAddress || !isEvmAddress(recipientAddress)) {
    throw new Error('Payment links settle in Polygon USDC and require a valid Polygon EVM address starting with 0x.');
  }

  const sb = requireSupabaseClient();

  const { data: authData, error: authError } = await sb.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('Sign in with your wallet before creating a payment link.');
  }

  const slug = generateSlug(input.memo, input.creatorHandle);
  try {
    const { data, error } = await sb
      .from('payment_links')
      .insert({
        slug,
        owner_user_id: authData.user.id,
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
      throw new Error(`Unable to create a shareable payment link: ${error.message}`);
    }
    return rowToLink(data);
  } catch (err: any) {
    console.error('Supabase createLink failed:', err);
    throw new Error('Unable to reach the payment-link service. Please try again.');
  }
}

export async function getLinkBySlug(slug: string): Promise<PaymentLink | null> {
  const sb = requireSupabaseClient();

  try {
    const { data, error } = await sb.rpc('get_public_payment_link', { p_slug: slug });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return null;
    return rowToLink(row);
  } catch (err) {
    console.error('Supabase getLinkBySlug failed:', err);
    return null;
  }
}

export async function listLinks(): Promise<PaymentLink[]> {
  const sb = requireSupabaseClient();

  try {
    const { data: authData } = await sb.auth.getUser();
    if (!authData.user) return [];
    const query = sb.from('payment_links').select('*').eq('owner_user_id', authData.user.id);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(rowToLink);
  } catch (err) {
    console.error('Supabase listLinks failed:', err);
    return [];
  }
}

export async function recordAttempt(linkId: string, payerAddress: string, trailsIntentId: string): Promise<void> {
  const sb = requireSupabaseClient();

  try {
    const { error } = await sb.rpc('create_payment_attempt', {
      p_link_id: linkId,
      p_payer_address: payerAddress || '',
      p_trails_intent_id: trailsIntentId,
    });
    if (error) {
      console.error('Supabase recordAttempt error:', error.message);
      throw new Error(error.message || 'Unable to register the payment session.');
    }
    return;
  } catch (err) {
    console.error('Supabase recordAttempt failed:', err);
    throw err instanceof Error ? err : new Error('Unable to register the payment session.');
  }
}

export async function verifyPaymentSession(
  linkId: string,
  sessionId: string
): Promise<{ verified: boolean; status: string; txHash?: string }> {
  const sb = requireSupabaseClient();

  const { data, error } = await sb.functions.invoke('verify-trails-payment', {
    body: { linkId, sessionId },
  });

  if (error) throw new Error(error.message || 'Payment verification failed.');
  return data as { verified: boolean; status: string; txHash?: string };
}

export async function getStats(): Promise<DashboardStats> {
  const sb = requireSupabaseClient();

  try {
    const { data: authData } = await sb.auth.getUser();
    if (!authData.user) return emptyStats();
    const query = sb
      .from('payment_links')
      .select('id, amount, status, recipient_address')
      .eq('owner_user_id', authData.user.id);
    const { data: links, error: lErr } = await query;
    const { data: payments, error: pErr } = await sb
      .from('payments')
      .select('status, link_id, created_at, confirmed_at');

    if (lErr || pErr || !links) return emptyStats();

    const linkRows = links ?? [];
    const paymentRows = payments ?? [];
    const confirmed = paymentRows.filter((p: any) => p.status === 'confirmed');
    const totalReceivedUsd = confirmed.reduce((sum: number, p: any) => {
      const link = linkRows.find((l: any) => l.id === p.link_id);
      return sum + Number(link?.amount ?? 0);
    }, 0);
    const settlementDurations = confirmed
      .filter((p: any) => p.created_at && p.confirmed_at)
      .map((p: any) => (new Date(p.confirmed_at).getTime() - new Date(p.created_at).getTime()) / 1000)
      .filter((seconds: number) => Number.isFinite(seconds) && seconds >= 0);

    return {
      totalReceivedUsd,
      activeLinks: linkRows.filter((l: any) => l.status === 'open').length,
      conversionRate: linkRows.length
        ? Math.round((linkRows.filter((l: any) => l.status === 'paid').length / linkRows.length) * 100)
        : 0,
      avgSettleSeconds: settlementDurations.length
        ? Math.round(settlementDurations.reduce((sum: number, seconds: number) => sum + seconds, 0) / settlementDurations.length)
        : null,
    };
  } catch (err) {
    console.error('Supabase getStats failed:', err);
    return emptyStats();
  }
}

function emptyStats(): DashboardStats {
  return { totalReceivedUsd: 0, activeLinks: 0, conversionRate: 0, avgSettleSeconds: null };
}
