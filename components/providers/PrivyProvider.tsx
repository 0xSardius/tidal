'use client';

import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
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

  // During SSR or before mount, render children without providers
  // This prevents hydration issues and prerendering errors
  if (!mounted) {
    return <>{children}</>;
  }

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Dev fallback - show UI without Privy auth
  if (!appId) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
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
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyAuthProvider>
  );
}
