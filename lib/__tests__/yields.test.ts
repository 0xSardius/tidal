import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_YIELD_CHAINS,
  YIELD_CHAIN_META,
  getYieldChainNames,
} from '../constants';
import { assessRisk, filterPools, type YieldOpportunity } from '../../app/api/yields/route';

// --- Chain constants ---

describe('SUPPORTED_YIELD_CHAINS', () => {
  it('has 6 chains', () => {
    expect(SUPPORTED_YIELD_CHAINS).toHaveLength(6);
  });

  it('contains the expected chain names', () => {
    const names = SUPPORTED_YIELD_CHAINS.map(c => c.name);
    expect(names).toContain('Base');
    expect(names).toContain('Arbitrum');
    expect(names).toContain('Optimism');
    expect(names).toContain('Polygon');
    expect(names).toContain('Ethereum');
    expect(names).toContain('Solana');
  });

  it('each chain has required fields', () => {
    for (const chain of SUPPORTED_YIELD_CHAINS) {
      expect(chain.name).toBeTruthy();
      expect(chain.chainId).toBeGreaterThan(0);
      expect(chain.color).toBeTruthy();
      expect(chain.icon).toBeTruthy();
    }
  });
});

describe('getYieldChainNames', () => {
  it('returns an array of 6 chain name strings', () => {
    const names = getYieldChainNames();
    expect(names).toHaveLength(6);
    expect(names).toEqual(['Base', 'Arbitrum', 'Optimism', 'Polygon', 'Ethereum', 'Solana']);
  });
});

describe('YIELD_CHAIN_META', () => {
  it('maps chain name to chain config', () => {
    expect(YIELD_CHAIN_META['Base'].chainId).toBe(8453);
    expect(YIELD_CHAIN_META['Arbitrum'].chainId).toBe(42161);
    expect(YIELD_CHAIN_META['Solana'].chainId).toBe(1151111081099710);
  });
});

// --- assessRisk ---

describe('assessRisk', () => {
  const makePool = (overrides: Record<string, unknown> = {}) => ({
    pool: 'test-pool',
    chain: 'Base',
    project: 'aave-v3',
    symbol: 'USDC',
    tvlUsd: 50_000_000,
    apy: 4.0,
    apyBase: 4.0,
    apyReward: null,
    rewardTokens: null,
    underlyingTokens: null,
    stablecoin: true,
    ilRisk: 'no',
    exposure: 'single',
    apyMean30d: 4.0,
    predictions: null,
    ...overrides,
  });

  it('returns 1 for AAVE stablecoin with high TVL', () => {
    expect(assessRisk(makePool())).toBe(1);
  });

  it('returns 1 for Morpho stablecoin with high TVL', () => {
    expect(assessRisk(makePool({ project: 'morpho-v1' }))).toBe(1);
  });

  it('returns 2 for single-exposure, no IL, decent TVL but non blue-chip protocol', () => {
    expect(assessRisk(makePool({ project: 'compound-v3', tvlUsd: 5_000_000 }))).toBe(2);
  });

  it('returns 3 for LP with IL risk', () => {
    expect(assessRisk(makePool({ ilRisk: 'yes', exposure: 'multi', project: 'aerodrome-v2' }))).toBe(3);
  });

  it('returns 3 for low TVL pool', () => {
    expect(assessRisk(makePool({ tvlUsd: 500_000, project: 'unknown-protocol' }))).toBe(3);
  });
});

// --- filterPools ---

describe('filterPools', () => {
  const pools: YieldOpportunity[] = [
    {
      id: '1', chain: 'Base', protocol: 'aave-v3', symbol: 'USDC', apy: 4.0,
      apyBase: 4.0, apyReward: null, tvlUsd: 50_000_000, stablecoin: true,
      ilRisk: 'no', exposure: 'single', apyMean30d: 4.0, riskLevel: 1,
    },
    {
      id: '2', chain: 'Arbitrum', protocol: 'aave-v3', symbol: 'USDC', apy: 5.1,
      apyBase: 5.1, apyReward: null, tvlUsd: 30_000_000, stablecoin: true,
      ilRisk: 'no', exposure: 'single', apyMean30d: 5.0, riskLevel: 1,
    },
    {
      id: '3', chain: 'Polygon', protocol: 'aave-v3', symbol: 'WETH', apy: 2.5,
      apyBase: 2.5, apyReward: null, tvlUsd: 20_000_000, stablecoin: false,
      ilRisk: 'no', exposure: 'single', apyMean30d: 2.5, riskLevel: 2,
    },
    {
      id: '4', chain: 'Optimism', protocol: 'sonne-finance', symbol: 'USDC', apy: 6.0,
      apyBase: 3.0, apyReward: 3.0, tvlUsd: 5_000_000, stablecoin: true,
      ilRisk: 'no', exposure: 'single', apyMean30d: 5.5, riskLevel: 2,
    },
    {
      id: '5', chain: 'Ethereum', protocol: 'aerodrome-v2', symbol: 'USDC-ETH', apy: 15.0,
      apyBase: 5.0, apyReward: 10.0, tvlUsd: 2_000_000, stablecoin: false,
      ilRisk: 'yes', exposure: 'multi', apyMean30d: 14.0, riskLevel: 3,
    },
    {
      id: '6', chain: 'Solana', protocol: 'kamino-lend', symbol: 'USDC', apy: 7.2,
      apyBase: 7.2, apyReward: null, tvlUsd: 100_000_000, stablecoin: true,
      ilRisk: 'no', exposure: 'single', apyMean30d: 7.0, riskLevel: 2,
    },
  ];

  it('returns all supported-chain pools when no chains filter', () => {
    const result = filterPools(pools, { limit: 20 });
    expect(result).toHaveLength(6);
  });

  it('filters by single chain', () => {
    const result = filterPools(pools, { chains: ['Base'], limit: 20 });
    expect(result).toHaveLength(1);
    expect(result[0].chain).toBe('Base');
  });

  it('filters by multiple chains', () => {
    const result = filterPools(pools, { chains: ['Base', 'Arbitrum'], limit: 20 });
    expect(result).toHaveLength(2);
    result.forEach(r => expect(['Base', 'Arbitrum']).toContain(r.chain));
  });

  it('filters by token', () => {
    const result = filterPools(pools, { token: 'USDC', limit: 20 });
    expect(result.length).toBeGreaterThan(0);
    result.forEach(r => expect(r.symbol).toContain('USDC'));
  });

  it('filters by maxRisk', () => {
    const result = filterPools(pools, { maxRisk: 1, limit: 20 });
    result.forEach(r => expect(r.riskLevel).toBe(1));
  });

  it('respects limit', () => {
    const result = filterPools(pools, { limit: 2 });
    expect(result).toHaveLength(2);
  });

  it('combines token and chain filters', () => {
    const result = filterPools(pools, { token: 'USDC', chains: ['Solana'], limit: 20 });
    expect(result).toHaveLength(1);
    expect(result[0].chain).toBe('Solana');
    expect(result[0].protocol).toBe('kamino-lend');
  });

  it('excludes unsupported chains', () => {
    const withUnsupported = [
      ...pools,
      {
        id: '99', chain: 'Fantom', protocol: 'spookyswap', symbol: 'USDC', apy: 20.0,
        apyBase: 20.0, apyReward: null, tvlUsd: 1_000_000, stablecoin: true,
        ilRisk: 'no', exposure: 'single', apyMean30d: 20.0, riskLevel: 2,
      } as YieldOpportunity,
    ];
    const result = filterPools(withUnsupported, { limit: 20 });
    expect(result.find(r => r.chain === 'Fantom')).toBeUndefined();
  });

  it('every opportunity has a valid chain field', () => {
    const supportedNames = getYieldChainNames();
    const result = filterPools(pools, { limit: 20 });
    result.forEach(r => {
      expect(r.chain).toBeTruthy();
      expect(supportedNames).toContain(r.chain);
    });
  });
});
