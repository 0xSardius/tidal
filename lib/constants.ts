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
