import { useEffect, useState } from 'react';
import { TopNav } from '@/components/TopNav';
import { StatCard } from '@/components/StatCard';
import { LinksTable } from '@/components/LinksTable';
import { ConnectModal } from '@/components/ConnectModal';
import { useWallet } from '@/context/WalletContext';
import { listLinks, getStats } from '@/lib/store';
import { PaymentLink, DashboardStats } from '@/lib/types';
import {
  Button,
  DashboardSkeleton,
  EmptyState,
  IconLock,
  IconPlus,
  PageHeader,
} from '@/components/ui';

export function Dashboard() {
  const { address, isConnected } = useWallet();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [l, s] = await Promise.all([listLinks(address), getStats(address)]);
      if (!cancelled) {
        setLinks(l);
        setStats(s);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  return (
    <>
      <TopNav />

      <section className="py-10 animate-fade-up">
        <PageHeader
          title="Your links"
          description="All amounts settle as USDC on Polygon."
          action={
            isConnected ? (
              <Button to="/create" size="sm">
                <IconPlus className="h-4 w-4" />
                New link
              </Button>
            ) : undefined
          }
        />

        {!isConnected ? (
          <EmptyState
            icon={<IconLock className="h-6 w-6" />}
            title="Connect to view your dashboard"
            description="Connect your wallet to access payment history, track USDC settlements, and manage agentic smart sessions."
            action={
              <Button onClick={() => setShowConnectModal(true)}>
                Connect wallet
              </Button>
            }
          />
        ) : loading || !stats ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="mb-9 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                label="Total received"
                value={`$${stats.totalReceivedUsd.toLocaleString()}`}
                delta="USDC on Polygon"
              />
              <StatCard label="Active links" value={String(stats.activeLinks)} delta="live" deltaGood={false} />
              <StatCard label="Conversion" value={`${stats.conversionRate}%`} delta="paid rate" />
              <StatCard
                label="Avg. settle time"
                value={`${stats.avgSettleSeconds}s`}
                delta="via Trails routing"
                deltaGood={false}
              />
            </div>

            <LinksTable links={links} />
          </>
        )}
      </section>

      <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </>
  );
}
