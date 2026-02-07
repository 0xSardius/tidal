'use client';

import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { base } from 'viem/chains';
import { formatUnits } from 'viem';
import { VAULT_REGISTRY, type VaultEntry } from '@/lib/vault-registry';
import { ERC4626_ABI } from '@/lib/vaults';

export interface VaultPosition {
  vaultSlug: string;
  vaultName: string;
  protocol: string;
  token: string;
  shares: bigint;
  assets: bigint;
  assetsFormatted: string;
  apyEstimate: number;
}

const vaultEntries = Object.entries(VAULT_REGISTRY) as [string, VaultEntry][];

export function useVaultPositions() {
  const { address } = useAccount();

  // Step 1: Read balanceOf for ALL vaults in one multicall
  const balanceContracts = useMemo(
    () =>
      vaultEntries.map(([, vault]) => ({
        address: vault.address,
        abi: ERC4626_ABI,
        functionName: 'balanceOf' as const,
        args: [address!] as const,
        chainId: base.id,
      })),
    [address]
  );

  const {
    data: balanceResults,
    isLoading: balancesLoading,
    refetch: refetchBalances,
  } = useReadContracts({
    contracts: balanceContracts,
    query: { enabled: !!address },
  });

  // Step 2: Build convertToAssets calls for vaults with non-zero balance
  const vaultsWithShares = useMemo(() => {
    if (!balanceResults) return [];
    return vaultEntries
      .map(([slug, vault], i) => {
        const result = balanceResults[i];
        if (result?.status === 'success' && result.result && (result.result as bigint) > 0n) {
          return { slug, vault, shares: result.result as bigint };
        }
        return null;
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [balanceResults]);

  const assetContracts = useMemo(
    () =>
      vaultsWithShares.map(({ vault, shares }) => ({
        address: vault.address,
        abi: ERC4626_ABI,
        functionName: 'convertToAssets' as const,
        args: [shares] as const,
        chainId: base.id,
      })),
    [vaultsWithShares]
  );

  const {
    data: assetResults,
    isLoading: assetsLoading,
    refetch: refetchAssets,
  } = useReadContracts({
    contracts: assetContracts,
    query: { enabled: vaultsWithShares.length > 0 },
  });

  // Step 3: Build position objects (only include vaults where convertToAssets succeeded)
  const positions: VaultPosition[] = useMemo(() => {
    return vaultsWithShares
      .map((item, i) => {
        // Only use the position if convertToAssets resolved correctly
        // Vault shares are 18 decimals but underlying may be 6 (USDC) — never use shares as fallback
        if (assetResults?.[i]?.status !== 'success') return null;
        const assets = assetResults[i].result as bigint;
        return {
          vaultSlug: item.slug,
          vaultName: item.vault.name,
          protocol: item.vault.protocol,
          token: item.vault.underlyingToken,
          shares: item.shares,
          assets,
          assetsFormatted: formatUnits(assets, item.vault.underlyingDecimals),
          apyEstimate: item.vault.apyEstimate,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [vaultsWithShares, assetResults]);

  const totalValueUsd = useMemo(
    () =>
      positions.reduce((sum, p) => {
        // Simplified: USDC = $1, ETH would need oracle
        if (p.token === 'USDC') return sum + parseFloat(p.assetsFormatted);
        return sum;
      }, 0),
    [positions]
  );

  return {
    positions,
    totalValueUsd,
    isLoading: balancesLoading || assetsLoading,
    refetch: () => {
      refetchBalances();
      refetchAssets();
    },
  };
}
