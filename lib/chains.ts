import { type Address } from 'viem';

/**
 * Multi-chain configuration — single source of truth for all chain data.
 * Covers tokens, AAVE addresses, and block explorers for each executable chain.
 */

export interface ChainToken {
  address: Address;
  symbol: string;
  decimals: number;
}

export interface ChainConfig {
  name: string;
  chainId: number;
  tokens: Record<string, ChainToken>;
  aave: {
    pool: Address;
    dataProvider: Address;
  };
  explorer: {
    name: string;
    url: string;
  };
}

export const TIDAL_CHAINS: Record<number, ChainConfig> = {
  // Base Mainnet
  8453: {
    name: 'Base',
    chainId: 8453,
    tokens: {
      USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
      WETH: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
      ETH: { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', decimals: 18 },
      DAI: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', decimals: 18 },
    },
    aave: {
      pool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as Address,
      dataProvider: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac' as Address,
    },
    explorer: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  },

  // Arbitrum One
  42161: {
    name: 'Arbitrum',
    chainId: 42161,
    tokens: {
      USDC: { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
      WETH: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18 },
      ETH: { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', decimals: 18 },
    },
    aave: {
      pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address,
      dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' as Address,
    },
    explorer: {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
    },
  },

  // Optimism
  10: {
    name: 'Optimism',
    chainId: 10,
    tokens: {
      USDC: { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', decimals: 6 },
      WETH: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
      ETH: { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', decimals: 18 },
    },
    aave: {
      pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address,
      dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' as Address,
    },
    explorer: {
      name: 'Optimistic Etherscan',
      url: 'https://optimistic.etherscan.io',
    },
  },
} as const;

/** All chain IDs that Tidal can execute transactions on */
export const EXECUTABLE_CHAIN_IDS = Object.keys(TIDAL_CHAINS).map(Number);

/** Get chain config by chainId */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return TIDAL_CHAINS[chainId];
}

/** Get token address for a specific chain */
export function getTokenAddress(chainId: number, symbol: string): Address | undefined {
  return TIDAL_CHAINS[chainId]?.tokens[symbol]?.address;
}

/** Get token info for a specific chain */
export function getTokensForChain(chainId: number): Record<string, ChainToken> | undefined {
  return TIDAL_CHAINS[chainId]?.tokens;
}

/** Get block explorer TX URL */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = TIDAL_CHAINS[chainId];
  if (!chain) return `https://basescan.org/tx/${txHash}`;
  return `${chain.explorer.url}/tx/${txHash}`;
}

/** Map chain name to chain ID */
export function chainNameToId(name: string): number | undefined {
  const lower = name.toLowerCase();
  for (const chain of Object.values(TIDAL_CHAINS)) {
    if (chain.name.toLowerCase() === lower) return chain.chainId;
  }
  return undefined;
}

/** Map chain ID to name */
export function chainIdToName(chainId: number): string | undefined {
  return TIDAL_CHAINS[chainId]?.name;
}
