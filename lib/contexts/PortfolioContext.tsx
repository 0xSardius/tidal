'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useAavePositions } from '@/lib/hooks/useAave';
import { useVaultPositions, type VaultPosition } from '@/lib/hooks/useVaultPositions';
import type { AavePosition } from '@/lib/aave';

interface PortfolioContextValue {
  aavePositions: AavePosition[];
  vaultPositions: VaultPosition[];
  aaveTotalUsd: number;
  vaultTotalUsd: number;
  totalValueUsd: number;
  isLoading: boolean;
  refetch: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const {
    positions: aavePositions,
    totalValueUsd: aaveTotalUsd,
    isLoading: aaveLoading,
    refetch: refetchAave,
  } = useAavePositions();

  const {
    positions: vaultPositions,
    totalValueUsd: vaultTotalUsd,
    isLoading: vaultLoading,
    refetch: refetchVaults,
  } = useVaultPositions();

  const value: PortfolioContextValue = {
    aavePositions,
    vaultPositions,
    aaveTotalUsd,
    vaultTotalUsd,
    totalValueUsd: aaveTotalUsd + vaultTotalUsd,
    isLoading: aaveLoading || vaultLoading,
    refetch: () => {
      refetchAave();
      refetchVaults();
    },
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return ctx;
}
