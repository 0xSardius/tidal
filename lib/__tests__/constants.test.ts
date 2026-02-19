import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN,
  CONTRACTS,
  TOKENS,
  RISK_DEPTHS,
  SUPPORTED_YIELD_CHAINS,
  YIELD_CHAIN_META,
  getYieldChainNames,
} from '../constants';
import type { RiskDepth } from '../constants';

// --- SUPPORTED_CHAINS (execution chains) ---

describe('SUPPORTED_CHAINS', () => {
  it('includes Base mainnet and Sepolia', () => {
    const chainIds = SUPPORTED_CHAINS.map(c => c.id);
    expect(chainIds).toContain(8453); // Base
    expect(chainIds).toContain(84532); // Base Sepolia
  });
});

describe('DEFAULT_CHAIN', () => {
  it('is Base mainnet', () => {
    expect(DEFAULT_CHAIN.id).toBe(8453);
    expect(DEFAULT_CHAIN.name).toBe('Base');
  });
});

// --- CONTRACTS ---

describe('CONTRACTS', () => {
  it('has AAVE pool address', () => {
    expect(CONTRACTS.AAVE_POOL).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('has AAVE data provider address', () => {
    expect(CONTRACTS.AAVE_POOL_DATA_PROVIDER).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('has USDC address', () => {
    expect(CONTRACTS.USDC).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('has WETH address', () => {
    expect(CONTRACTS.WETH).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});

// --- TOKENS ---

describe('TOKENS', () => {
  it('USDC has correct decimals', () => {
    expect(TOKENS.USDC.decimals).toBe(6);
    expect(TOKENS.USDC.symbol).toBe('USDC');
    expect(TOKENS.USDC.address).toBe(CONTRACTS.USDC);
  });

  it('WETH has correct decimals', () => {
    expect(TOKENS.WETH.decimals).toBe(18);
    expect(TOKENS.WETH.symbol).toBe('WETH');
    expect(TOKENS.WETH.address).toBe(CONTRACTS.WETH);
  });
});

// --- RISK_DEPTHS ---

describe('RISK_DEPTHS', () => {
  const depths: RiskDepth[] = ['shallows', 'mid-depth', 'deep-water'];

  it('has all three tiers', () => {
    expect(Object.keys(RISK_DEPTHS)).toEqual(depths);
  });

  it('each tier has required fields', () => {
    for (const depth of depths) {
      const config = RISK_DEPTHS[depth];
      expect(config.label).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.emoji).toBeTruthy();
      expect(config.color).toBeTruthy();
      expect(config.maxRisk).toBeGreaterThanOrEqual(1);
      expect(config.maxRisk).toBeLessThanOrEqual(3);
      expect(config.allowedStrategies.length).toBeGreaterThan(0);
    }
  });

  it('Shallows has maxRisk 1', () => {
    expect(RISK_DEPTHS.shallows.maxRisk).toBe(1);
  });

  it('Mid-Depth has maxRisk 2', () => {
    expect(RISK_DEPTHS['mid-depth'].maxRisk).toBe(2);
  });

  it('Deep Water has maxRisk 3', () => {
    expect(RISK_DEPTHS['deep-water'].maxRisk).toBe(3);
  });

  it('tiers have progressively more strategies', () => {
    expect(RISK_DEPTHS.shallows.allowedStrategies.length).toBeLessThanOrEqual(
      RISK_DEPTHS['mid-depth'].allowedStrategies.length
    );
    expect(RISK_DEPTHS['mid-depth'].allowedStrategies.length).toBeLessThanOrEqual(
      RISK_DEPTHS['deep-water'].allowedStrategies.length
    );
  });

  it('Shallows only allows stablecoin-lending', () => {
    expect(RISK_DEPTHS.shallows.allowedStrategies).toEqual(['stablecoin-lending']);
  });

  it('Deep Water allows leverage', () => {
    expect(RISK_DEPTHS['deep-water'].allowedStrategies).toContain('leverage');
  });
});

// --- SUPPORTED_YIELD_CHAINS ---

describe('SUPPORTED_YIELD_CHAINS', () => {
  it('has 6 chains', () => {
    expect(SUPPORTED_YIELD_CHAINS).toHaveLength(6);
  });

  it('Base is the first chain', () => {
    expect(SUPPORTED_YIELD_CHAINS[0].name).toBe('Base');
    expect(SUPPORTED_YIELD_CHAINS[0].chainId).toBe(8453);
  });

  it('includes all expected EVM chains', () => {
    const names = SUPPORTED_YIELD_CHAINS.map(c => c.name);
    expect(names).toContain('Arbitrum');
    expect(names).toContain('Optimism');
    expect(names).toContain('Polygon');
    expect(names).toContain('Ethereum');
  });

  it('includes Solana', () => {
    const solana = SUPPORTED_YIELD_CHAINS.find(c => c.name === 'Solana');
    expect(solana).toBeDefined();
    expect(solana!.chainId).toBe(1151111081099710);
  });
});

describe('YIELD_CHAIN_META', () => {
  it('provides lookup by chain name', () => {
    expect(YIELD_CHAIN_META['Base']).toBeDefined();
    expect(YIELD_CHAIN_META['Base'].chainId).toBe(8453);
    expect(YIELD_CHAIN_META['Arbitrum'].chainId).toBe(42161);
  });

  it('has all 6 chains', () => {
    expect(Object.keys(YIELD_CHAIN_META)).toHaveLength(6);
  });
});

describe('getYieldChainNames', () => {
  it('returns array of 6 strings', () => {
    const names = getYieldChainNames();
    expect(names).toHaveLength(6);
    names.forEach(n => expect(typeof n).toBe('string'));
  });

  it('matches DeFi Llama naming convention', () => {
    const names = getYieldChainNames();
    // DeFi Llama uses "Arbitrum" not "Arbitrum One"
    expect(names).toContain('Arbitrum');
    // DeFi Llama uses "Optimism" not "OP Mainnet"
    expect(names).toContain('Optimism');
  });
});
