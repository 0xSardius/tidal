import { base, baseSepolia } from 'viem/chains';

// Chain configuration
export const SUPPORTED_CHAINS = [baseSepolia, base] as const;
export const DEFAULT_CHAIN = baseSepolia;

// Contract addresses on Base Sepolia
export const CONTRACTS = {
  // AAVE V3 on Base Sepolia
  AAVE_POOL: '0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b' as const,
  AAVE_POOL_DATA_PROVIDER: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac' as const,

  // Test tokens on Base Sepolia
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const,
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
