import { CONTRACTS } from './constants';

/**
 * ERC-4626 Vault Registry
 *
 * Adding a new vault = adding one entry here. No new code needed.
 * The generic vault adapter (vaults.ts) handles all ERC-4626 operations.
 */

export interface VaultEntry {
  name: string;
  protocol: string; // DeFi Llama project slug (for matching yield data)
  curator: string;
  address: `0x${string}`;
  underlyingToken: string; // Symbol: 'USDC', 'WETH', etc.
  underlyingAddress: `0x${string}`;
  underlyingDecimals: number;
  chainId: number;
  riskLevel: 1 | 2 | 3; // Maps to Shallows / Mid-Depth / Deep Water
  description: string;
}

export const VAULT_REGISTRY: Record<string, VaultEntry> = {
  // === Morpho Vaults (Curated by top risk managers) ===

  'steakhouse-prime-usdc': {
    name: 'Steakhouse Prime USDC',
    protocol: 'morpho-v1',
    curator: 'Steakhouse Financial',
    address: '0xBEEFE94c8aD530842bfE7d8B397938fFc1cb83b2',
    underlyingToken: 'USDC',
    underlyingAddress: CONTRACTS.USDC,
    underlyingDecimals: 6,
    chainId: 8453,
    riskLevel: 2,
    description: 'Institutional-grade USDC vault. Coinbase routes lending through this vault. ~$440M TVL.',
  },

  'gauntlet-usdc-prime': {
    name: 'Gauntlet USDC Prime',
    protocol: 'morpho-v1',
    curator: 'Gauntlet',
    address: '0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61',
    underlyingToken: 'USDC',
    underlyingAddress: CONTRACTS.USDC,
    underlyingDecimals: 6,
    chainId: 8453,
    riskLevel: 2,
    description: 'Risk-optimized USDC vault curated by Gauntlet. Blue-chip collateral only. ~$296M TVL.',
  },

  'moonwell-flagship-usdc': {
    name: 'Moonwell Flagship USDC',
    protocol: 'morpho-v1',
    curator: 'B.Protocol',
    address: '0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca',
    underlyingToken: 'USDC',
    underlyingAddress: CONTRACTS.USDC,
    underlyingDecimals: 6,
    chainId: 8453,
    riskLevel: 2,
    description: 'Moonwell-curated USDC vault on Morpho. Blue-chip collateral markets. ~$15M TVL.',
  },

  'seamless-usdc': {
    name: 'Seamless USDC Vault',
    protocol: 'morpho-v1',
    curator: 'Gauntlet',
    address: '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738',
    underlyingToken: 'USDC',
    underlyingAddress: CONTRACTS.USDC,
    underlyingDecimals: 6,
    chainId: 8453,
    riskLevel: 2,
    description: 'Seamless Protocol USDC vault curated by Gauntlet. ~$23M TVL.',
  },
} as const;

export type VaultSlug = keyof typeof VAULT_REGISTRY;

/**
 * Get vaults available for a given risk level
 */
export function getVaultsForRisk(maxRisk: number): VaultEntry[] {
  return Object.values(VAULT_REGISTRY).filter((v) => v.riskLevel <= maxRisk);
}

/**
 * Get vaults for a specific token
 */
export function getVaultsForToken(token: string, maxRisk: number = 3): VaultEntry[] {
  return Object.values(VAULT_REGISTRY).filter(
    (v) => v.underlyingToken === token && v.riskLevel <= maxRisk
  );
}

/**
 * Look up a vault by slug
 */
export function getVault(slug: string): VaultEntry | undefined {
  return VAULT_REGISTRY[slug];
}

/**
 * Get all vault slugs
 */
export function getVaultSlugs(): string[] {
  return Object.keys(VAULT_REGISTRY);
}
