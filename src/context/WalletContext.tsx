import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { omsWalletService, OmsUserSession, OmsSmartSession, CustodyModel } from '@/services/omsWalletService';

export const POLYGON_MAINNET_PARAMS = {
  chainId: '0x89', // 137
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/'],
};

export type AuthMethod = 'browser' | 'oms-email' | 'oms-agent';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  authMethod: AuthMethod | null;
  custodyModel: CustodyModel | null;
  omsUser: OmsUserSession | null;
  smartSessions: OmsSmartSession[];
  connect: (targetProvider?: any) => Promise<void>;
  disconnect: () => void;
  switchToPolygon: () => Promise<void>;
  sendOmsEmailOtp: (email: string) => Promise<{ challengeId: string }>;
  verifyOmsOtp: (email: string, code: string) => Promise<void>;
  createAgentSmartSession: (dailyLimitUsdc: number, expiryDays?: number) => Promise<OmsSmartSession>;
  revokeAgentSmartSession: (sessionId: string) => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [custodyModel, setCustodyModel] = useState<CustodyModel | null>(null);
  const [omsUser, setOmsUser] = useState<OmsUserSession | null>(null);
  const [smartSessions, setSmartSessions] = useState<OmsSmartSession[]>([]);
  const [activeProvider, setActiveProvider] = useState<any>(null);

  // Synchronize OMS session on mount
  useEffect(() => {
    const existingOms = omsWalletService.getActiveUserSession();
    if (existingOms) {
      setAddress(existingOms.address);
      setOmsUser(existingOms);
      setAuthMethod('oms-email');
      setCustodyModel(existingOms.custodyModel);
      setChainId(137);
    }
    setSmartSessions(omsWalletService.getSmartSessions());
  }, []);

  // Synchronize window.ethereum or activeProvider state if available
  useEffect(() => {
    const provider = activeProvider || (typeof window !== 'undefined' ? (window as any).ethereum : null);
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0 && authMethod === 'browser') {
        setAddress(accounts[0]);
      } else if (authMethod === 'browser') {
        setAddress(null);
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      setChainId(parseInt(hexChainId, 16));
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [authMethod, activeProvider]);

  const connect = useCallback(async (targetProvider?: any) => {
    const provider =
      targetProvider ||
      (typeof window !== 'undefined'
        ? (window as any).phantom?.ethereum ||
          (window as any).ethereum ||
          (window as any).phantom?.solana ||
          (window as any).solana
        : null);

    if (provider) {
      // 1. Try EVM eth_requestAccounts if request method exists
      if (provider.request) {
        try {
          const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
          const hexChainId: string = await provider.request({ method: 'eth_chainId' });

          setActiveProvider(provider);
          setAddress(accounts[0]);
          setChainId(parseInt(hexChainId, 16));
          setAuthMethod('browser');
          setCustodyModel('non-custodial');
          return;
        } catch (evmErr: any) {
          // If the provider rejects eth_requestAccounts (e.g. Solana-only provider or mode), attempt Solana connect
          if (evmErr?.message?.includes('Unsupported method') || evmErr?.code === -32601) {
            if (provider.connect) {
              const resp = await provider.connect();
              const solAddress = (resp?.publicKey || provider.publicKey)?.toString();
              if (solAddress) {
                setActiveProvider(provider);
                setAddress(solAddress);
                setChainId(900);
                setAuthMethod('browser');
                setCustodyModel('non-custodial');
                return;
              }
            }
          }
          throw evmErr;
        }
      }

      // 2. Solana Native Provider Connect
      if (provider.connect) {
        const resp = await provider.connect();
        const solAddress = (resp?.publicKey || provider.publicKey)?.toString();
        if (solAddress) {
          setActiveProvider(provider);
          setAddress(solAddress);
          setChainId(900);
          setAuthMethod('browser');
          setCustodyModel('non-custodial');
          return;
        }
      }
    }

    throw new Error('No browser Web3 extension found. Please install a Web3 wallet or use Polygon OMS Email OTP.');
  }, []);

  const sendOmsEmailOtp = useCallback(async (email: string) => {
    return await omsWalletService.sendEmailOtp(email);
  }, []);

  const verifyOmsOtp = useCallback(async (email: string, code: string) => {
    const session = await omsWalletService.verifyEmailOtp(email, code);
    setAddress(session.address);
    setOmsUser(session);
    setAuthMethod('oms-email');
    setCustodyModel('non-custodial');
    setChainId(137);
  }, []);

  const createAgentSmartSession = useCallback(async (dailyLimitUsdc: number, expiryDays = 30) => {
    const walletId = omsUser?.walletId || 'wlet_oms_live';
    const smartSession = await omsWalletService.createSmartSession(walletId, {
      dailyLimitUsdc,
      expiryDays,
    });
    setSmartSessions(omsWalletService.getSmartSessions());
    return smartSession;
  }, [omsUser]);

  const revokeAgentSmartSession = useCallback(async (sessionId: string) => {
    await omsWalletService.revokeSmartSession(sessionId);
    setSmartSessions(omsWalletService.getSmartSessions());
  }, []);

  const disconnect = useCallback(() => {
    omsWalletService.logout();
    setActiveProvider(null);
    setAddress(null);
    setChainId(null);
    setOmsUser(null);
    setAuthMethod(null);
    setCustodyModel(null);
  }, []);

  const switchToPolygon = useCallback(async () => {
    const provider = activeProvider || (typeof window !== 'undefined' ? (window as any).ethereum : null);
    if (provider) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: POLYGON_MAINNET_PARAMS.chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [POLYGON_MAINNET_PARAMS],
            });
          } catch (addError) {
            console.error('Failed to add Polygon network', addError);
          }
        }
      }
    } else {
      setChainId(137);
    }
  }, [activeProvider]);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnected: !!address,
        authMethod,
        custodyModel,
        omsUser,
        smartSessions,
        connect,
        disconnect,
        switchToPolygon,
        sendOmsEmailOtp,
        verifyOmsOtp,
        createAgentSmartSession,
        revokeAgentSmartSession,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>');
  return ctx;
}

export function shortAddress(addr: string | null): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function isEvmAddress(addr: string | null): boolean {
  if (!addr) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function isPolygonChain(chainId: number | null): boolean {
  return chainId === 137 || chainId === 80002;
}
