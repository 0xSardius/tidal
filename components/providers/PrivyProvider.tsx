'use client';

import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base, baseSepolia } from 'viem/chains';
import { useState, useEffect } from 'react';
import { wagmiConfig } from '@/lib/wagmi';

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    setMounted(true);
  }, []);

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // During SSR or before mount, provide minimal wagmi context
  // This allows wagmi hooks to work without Privy auth
  if (!mounted || !appId) {
    return (
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <PrivyAuthProvider
      appId={appId}
      config={{
        // Login methods
        loginMethods: ['email', 'google', 'wallet'],

        // Appearance
        appearance: {
          theme: 'dark',
          accentColor: '#22d3ee', // tidal-glow cyan
          showWalletLoginFirst: false,
        },

        // Embedded wallets - Coinbase Smart Wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },

        // Default chain
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia, base],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={wagmiConfig}>
          {children}
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyAuthProvider>
  );
}
