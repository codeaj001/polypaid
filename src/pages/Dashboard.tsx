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
  const { isConnected, isAuthenticated, authLoading, authenticate } = useWallet();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [l, s] = await Promise.all([listLinks(), getStats()]);
      if (!cancelled) {
        setLinks(l);
        setStats(s);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <>
      <TopNav />

      <section className="py-10 animate-fade-up">
        <PageHeader
          title="Your links"
          description="All amounts settle as USDC on Polygon."
          action={
            isAuthenticated ? (
              <Button to="/create" size="sm">
                <IconPlus className="h-4 w-4" />
                New link
              </Button>
            ) : undefined
          }
        />

        {!isAuthenticated ? (
          <EmptyState
            icon={<IconLock className="h-6 w-6" />}
            title={isConnected ? 'Sign in to view your dashboard' : 'Connect to view your dashboard'}
            description="Wallet ownership must be verified with a signed message before payment links and settlement history are shown."
            action={
              <Button
                disabled={authLoading}
                onClick={() => isConnected ? authenticate().catch(() => {}) : setShowConnectModal(true)}
              >
                {authLoading ? 'Checking session…' : isConnected ? 'Sign in with wallet' : 'Connect wallet'}
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
                value={stats.avgSettleSeconds === null ? '—' : `${stats.avgSettleSeconds}s`}
                delta={stats.avgSettleSeconds === null ? 'No settled payments yet' : 'verified settlements'}
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
