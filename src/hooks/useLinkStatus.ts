import { useEffect, useState } from 'react';
import { getLinkBySlug } from '@/lib/store';
import { LinkStatus } from '@/lib/types';

/**
 * Live status for a single payment link on the public pay page.
 * Polls the sanitized public-link RPC so anonymous users never receive the
 * private owner column from the underlying table.
 */
export function useLinkStatus(linkId: string, slug: string, initial: LinkStatus, expiresAt: string | null) {
  const [status, setStatus] = useState<LinkStatus>(initial);

  useEffect(() => {
    const interval = setInterval(async () => {
      const link = await getLinkBySlug(slug).catch(() => null);
      if (link?.status) setStatus(withExpiry(link.status, link.expiresAt));
    }, 3000);
    return () => clearInterval(interval);
  }, [expiresAt, linkId, slug]);

  return status;
}

function withExpiry(status: LinkStatus, expiresAt: string | null): LinkStatus {
  if (status !== 'open' || !expiresAt) return status;
  return new Date(expiresAt).getTime() <= Date.now() ? 'expired' : status;
}
