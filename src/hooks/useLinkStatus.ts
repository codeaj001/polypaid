import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase-client';
import { getLinkBySlug } from '@/lib/store';
import { LinkStatus } from '@/lib/types';

/**
 * Live status for a single payment link on the public pay page.
 * Uses Supabase Realtime when configured; otherwise polls every 3s
 * (also what runs against the localStorage store).
 */
export function useLinkStatus(linkId: string, slug: string, initial: LinkStatus) {
  const [status, setStatus] = useState<LinkStatus>(initial);

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (supabase) {
      const channel = supabase
        .channel(`link-${linkId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'payment_links', filter: `id=eq.${linkId}` },
          (payload: any) => setStatus(payload.new.status)
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }

    const interval = setInterval(async () => {
      const link = await getLinkBySlug(slug).catch(() => null);
      if (link?.status) setStatus(link.status);
    }, 3000);
    return () => clearInterval(interval);
  }, [linkId, slug]);

  return status;
}
