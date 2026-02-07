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
  // ============================
  // SHALLOWS (Risk Level 1)
  // Conservative, institutional-grade, high TVL
  // ============================

  'steakhouse-prime-usdc': {
    name: 'Steakhouse Prime USDC',
    protocol: 'morpho-v1',
    curator: 'Steakhouse Financial',
    address: '0xBEEFE94c8aD530842bfE7d8B397938fFc1cb83b2',
    underlyingToken: 'USDC',
    underlyingAddress: CONTRACTS.USDC,
    underlyingDecimals: 6,
    chainId: 8453,
    riskLevel: 1,
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
    riskLevel: 1,
    description: 'Risk-optimized USDC vault curated by Gauntlet. Blue-chip collateral only. ~$296M TVL.',
  },

  // ============================
  // MID-DEPTH (Risk Level 2)
  // Higher yield, reward-boosted, more aggressive strategies
  // ============================

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
    description: 'Reward-boosted USDC vault with WELL token incentives. ~$15M TVL, ~3.8% APY.',
  },

  'steakhouse-high-yield-usdc': {
    name: 'Steakhouse High Yield USDC',
    protocol: 'morpho-v1',
    curator: 'Steakhouse Financial',
    address: '0xBEEFA7B88064FeEF0cEe02AAeBBd95D30df3878F',
    underlyingToken: 'USDC',
    underlyingAddress: CONTRACTS.USDC,
    underlyingDecimals: 6,
    chainId: 8453,
    riskLevel: 2,
    description: 'Aggressive Steakhouse vault with higher-yield market allocations. ~$7.7M TVL, ~3.5% APY.',
  },

  'extrafi-xlend-usdc': {
    name: 'Extrafi XLend USDC',
    protocol: 'morpho-v1',
    curator: 'Extrafi',
    address: '0x23479229e52Ab6aaD312D0B03DF9F33B46753B5e',
    underlyingToken: 'USDC',
    underlyingAddress: CONTRACTS.USDC,
    underlyingDecimals: 6,
    chainId: 8453,
    riskLevel: 2,
    description: 'USDC vault with EXTRA token rewards on top of base yield. ~$5.4M TVL, ~3.9% APY.',
  },

  'clearstar-usdc-reactor': {
    name: 'Clearstar USDC Reactor',
    protocol: 'morpho-v1',
    curator: 'Clearstar',
    address: '0x1D3b1Cd0a0f242d598834b3F2d126dC6bd774657',
    underlyingToken: 'USDC',
    underlyingAddress: CONTRACTS.USDC,
    underlyingDecimals: 6,
    chainId: 8453,
    riskLevel: 2,
    description: 'Aggressive USDC vault with highest base yield among Morpho vaults. ~$2.9M TVL, ~4.1% APY.',
  },

  'moonwell-flagship-eth': {
    name: 'Moonwell Flagship ETH',
    protocol: 'morpho-v1',
    curator: 'B.Protocol',
    address: '0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1',
    underlyingToken: 'WETH',
    underlyingAddress: CONTRACTS.WETH,
    underlyingDecimals: 18,
    chainId: 8453,
    riskLevel: 2,
    description: 'ETH vault with WELL token rewards. Earn yield on ETH holdings. ~$13.2M TVL, ~2.9% APY.',
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
    description: 'Seamless Protocol USDC vault with SEAM rewards. ~$23M TVL, ~3.1% APY.',
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
