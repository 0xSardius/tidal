import { base, baseSepolia } from 'viem/chains';

// Chain configuration - Base Mainnet for demo
export const SUPPORTED_CHAINS = [base, baseSepolia] as const;
export const DEFAULT_CHAIN = base;

// Contract addresses on Base Mainnet
export const CONTRACTS = {
  // AAVE V3 on Base Mainnet
  AAVE_POOL: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as const,
  AAVE_POOL_DATA_PROVIDER: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac' as const,

  // Tokens on Base Mainnet
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
  WETH: '0x4200000000000000000000000000000000000006' as const,
} as const;

// Token metadata
export const TOKENS = {
  USDC: {
    address: CONTRACTS.USDC,
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
  WETH: {
    address: CONTRACTS.WETH,
    symbol: 'WETH',
    decimals: 18,
    name: 'Wrapped Ether',
  },
} as const;

// Risk depth configuration
export const RISK_DEPTHS = {
  shallows: {
    label: 'Shallows',
    description: 'Calm, protected waters',
    emoji: '🏖️',
    color: 'cyan',
    maxRisk: 1,
    allowedStrategies: ['stablecoin-lending'],
  },
  'mid-depth': {
    label: 'Mid-Depth',
    description: 'Balanced currents',
    emoji: '🌊',
    color: 'teal',
    maxRisk: 2,
    allowedStrategies: ['stablecoin-lending', 'lp-positions', 'single-asset-lending'],
  },
  'deep-water': {
    label: 'Deep Water',
    description: 'Strong currents, bigger rewards',
    emoji: '🐋',
    color: 'blue',
    maxRisk: 3,
    allowedStrategies: ['stablecoin-lending', 'lp-positions', 'single-asset-lending', 'leverage'],
  },
} as const;

export type RiskDepth = keyof typeof RISK_DEPTHS;

// Chains supported for yield scanning (separate from execution-only SUPPORTED_CHAINS)
// `name` values match DeFi Llama API exactly
export const SUPPORTED_YIELD_CHAINS = [
  { name: 'Base', chainId: 8453, color: 'blue', icon: '🔵' },
  { name: 'Arbitrum', chainId: 42161, color: 'sky', icon: '🔷' },
  { name: 'Optimism', chainId: 10, color: 'red', icon: '🔴' },
  { name: 'Polygon', chainId: 137, color: 'purple', icon: '🟣' },
  { name: 'Ethereum', chainId: 1, color: 'slate', icon: '⟠' },
  { name: 'Solana', chainId: 1151111081099710, color: 'green', icon: '◎' },
] as const;

export type YieldChainName = typeof SUPPORTED_YIELD_CHAINS[number]['name'];

export const YIELD_CHAIN_META: Record<string, typeof SUPPORTED_YIELD_CHAINS[number]> =
  Object.fromEntries(SUPPORTED_YIELD_CHAINS.map(c => [c.name, c]));

export function getYieldChainNames(): string[] {
  return SUPPORTED_YIELD_CHAINS.map(c => c.name);
}
