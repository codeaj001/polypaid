import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { ConnectModal } from './ConnectModal';
import { Button, EmptyState, IconAgent } from '@/components/ui';

export function AgentSessionCard() {
  const { smartSessions, revokeAgentSmartSession } = useWallet();
  const [showConnectModal, setShowConnectModal] = useState(false);

  const activeSessions = smartSessions.filter((s) => s.status === 'active');

  return (
    <div className="surface mb-8 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-dim text-blue">
            <IconAgent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold tracking-tight text-ink">
              Agentic smart sessions
            </h3>
            <p className="text-xs text-ink-soft">
              Scoped, on-chain permissions for autonomous AI agents paying PolyPay links.
            </p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowConnectModal(true)}>
          New agent session
        </Button>
      </div>

      {activeSessions.length === 0 ? (
        <EmptyState
          className="border-dashed shadow-none"
          title="No active sessions"
          description="Authorize an agent session to allow AI bots to settle payments autonomously up to a spending cap."
        />
      ) : (
        <div className="space-y-3">
          {activeSessions.map((session) => (
            <div
              key={session.sessionId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper p-4 font-mono text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  <span className="h-2 w-2 rounded-full bg-good" />
                  Session ID: {session.sessionId}
                </div>
                <div className="text-[11px] text-ink-soft">
                  Daily Limit: <b className="text-ink">${session.dailyLimitUsdc} USDC</b> · Allowed
                  Contract: Polygon USDC
                </div>
                <div className="text-[10.5px] text-ink-soft">
                  Expires: {new Date(session.expiresAt).toLocaleDateString()}
                </div>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={() => revokeAgentSmartSession(session.sessionId)}
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </div>
  );
}
