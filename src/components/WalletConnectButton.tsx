import { useState } from 'react';
import { useWallet, shortAddress, isEvmAddress } from '@/context/WalletContext';
import { ConnectModal } from './ConnectModal';
import { Badge, Button, IconWallet, IconWarning } from '@/components/ui';

export function WalletConnectButton() {
  const { address, chainId, isConnected, authMethod, disconnect, switchToPolygon } = useWallet();
  const [showConnectModal, setShowConnectModal] = useState(false);

  const isEvm = isEvmAddress(address);
  const isPolygon = isEvm && (chainId === 137 || chainId === 80002);

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        {!isEvm ? (
          <Button variant="danger" size="sm" onClick={() => setShowConnectModal(true)} className="animate-pulse">
            <IconWarning className="h-3.5 w-3.5" />
            Connect Polygon EVM
          </Button>
        ) : !isPolygon ? (
          <Button variant="danger" size="sm" onClick={switchToPolygon} className="animate-pulse">
            <IconWarning className="h-3.5 w-3.5" />
            Switch to Polygon
          </Button>
        ) : null}

        <div className="inline-flex items-center gap-2 rounded-full border border-blue-mid bg-blue-dim px-3.5 py-2 font-mono text-[12px] text-blue">
          <span className="h-1.5 w-1.5 rounded-full bg-blue" />
          <span>{shortAddress(address)}</span>
          {!isEvm && <Badge tone="warn">Solana</Badge>}
          {authMethod === 'oms-email' && <Badge tone="blue">OMS 7702</Badge>}
          {authMethod === 'oms-agent' && <Badge tone="blue">Agent</Badge>}
          <button
            type="button"
            onClick={disconnect}
            className="ml-0.5 rounded-full px-1.5 py-0.5 text-blue/60 transition-colors duration-200 hover:bg-blue/10 hover:text-blue"
            title="Disconnect wallet"
            aria-label="Disconnect wallet"
          >
            ×
          </button>
        </div>
        <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
      </div>
    );
  }

  return (
    <>
      <Button variant="ink" size="sm" onClick={() => setShowConnectModal(true)}>
        <IconWallet className="h-3.5 w-3.5" />
        Connect
      </Button>
      <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </>
  );
}
