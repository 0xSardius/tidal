import { describe, it, expect } from 'vitest';
import {
  TIDAL_CHAINS,
  EXECUTABLE_CHAIN_IDS,
  getChainConfig,
  getTokenAddress,
  getTokensForChain,
  getExplorerTxUrl,
  chainNameToId,
  chainIdToName,
} from '../chains';

describe('TIDAL_CHAINS', () => {
  it('has 3 executable chains', () => {
    expect(Object.keys(TIDAL_CHAINS)).toHaveLength(3);
  });

  it('includes Base, Arbitrum, and Optimism', () => {
    expect(TIDAL_CHAINS[8453]).toBeDefined();
    expect(TIDAL_CHAINS[42161]).toBeDefined();
    expect(TIDAL_CHAINS[10]).toBeDefined();
  });

  it('each chain has USDC and WETH tokens', () => {
    for (const chain of Object.values(TIDAL_CHAINS)) {
      expect(chain.tokens.USDC).toBeDefined();
      expect(chain.tokens.WETH).toBeDefined();
      expect(chain.tokens.USDC.decimals).toBe(6);
      expect(chain.tokens.WETH.decimals).toBe(18);
    }
  });

  it('each chain has AAVE pool and data provider', () => {
    for (const chain of Object.values(TIDAL_CHAINS)) {
      expect(chain.aave.pool).toMatch(/^0x/);
      expect(chain.aave.dataProvider).toMatch(/^0x/);
    }
  });

  it('each chain has an explorer', () => {
    for (const chain of Object.values(TIDAL_CHAINS)) {
      expect(chain.explorer.name.length).toBeGreaterThan(0);
      expect(chain.explorer.url).toMatch(/^https:\/\//);
    }
  });
});

describe('EXECUTABLE_CHAIN_IDS', () => {
  it('contains all 3 chain IDs', () => {
    expect(EXECUTABLE_CHAIN_IDS).toContain(8453);
    expect(EXECUTABLE_CHAIN_IDS).toContain(42161);
    expect(EXECUTABLE_CHAIN_IDS).toContain(10);
    expect(EXECUTABLE_CHAIN_IDS).toHaveLength(3);
  });
});

describe('getChainConfig', () => {
  it('returns config for known chain', () => {
    const config = getChainConfig(8453);
    expect(config).toBeDefined();
    expect(config!.name).toBe('Base');
  });

  it('returns undefined for unknown chain', () => {
    expect(getChainConfig(999)).toBeUndefined();
  });
});

describe('getTokenAddress', () => {
  it('returns USDC address on Base', () => {
    const addr = getTokenAddress(8453, 'USDC');
    expect(addr).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
  });

  it('returns USDC address on Arbitrum', () => {
    const addr = getTokenAddress(42161, 'USDC');
    expect(addr).toBe('0xaf88d065e77c8cC2239327C5EDb3A432268e5831');
  });

  it('returns undefined for unknown token', () => {
    expect(getTokenAddress(8453, 'SHIB')).toBeUndefined();
  });
});

describe('getTokensForChain', () => {
  it('returns tokens for Base', () => {
    const tokens = getTokensForChain(8453);
    expect(tokens).toBeDefined();
    expect(tokens!.USDC).toBeDefined();
    expect(tokens!.ETH).toBeDefined();
  });

  it('returns undefined for unknown chain', () => {
    expect(getTokensForChain(999)).toBeUndefined();
  });
});

describe('getExplorerTxUrl', () => {
  it('returns BaseScan URL for Base', () => {
    const url = getExplorerTxUrl(8453, '0xabc');
    expect(url).toBe('https://basescan.org/tx/0xabc');
  });

  it('returns Arbiscan URL for Arbitrum', () => {
    const url = getExplorerTxUrl(42161, '0xdef');
    expect(url).toBe('https://arbiscan.io/tx/0xdef');
  });

  it('returns Optimistic Etherscan URL for Optimism', () => {
    const url = getExplorerTxUrl(10, '0x123');
    expect(url).toBe('https://optimistic.etherscan.io/tx/0x123');
  });

  it('falls back to BaseScan for unknown chain', () => {
    const url = getExplorerTxUrl(999, '0xfoo');
    expect(url).toBe('https://basescan.org/tx/0xfoo');
  });
});

describe('chainNameToId', () => {
  it('maps Base to 8453', () => {
    expect(chainNameToId('Base')).toBe(8453);
  });

  it('maps Arbitrum to 42161', () => {
    expect(chainNameToId('Arbitrum')).toBe(42161);
  });

  it('maps Optimism to 10', () => {
    expect(chainNameToId('Optimism')).toBe(10);
  });

  it('is case-insensitive', () => {
    expect(chainNameToId('base')).toBe(8453);
    expect(chainNameToId('ARBITRUM')).toBe(42161);
  });

  it('returns undefined for unknown chain', () => {
    expect(chainNameToId('Solana')).toBeUndefined();
  });
});

describe('chainIdToName', () => {
  it('maps 8453 to Base', () => {
    expect(chainIdToName(8453)).toBe('Base');
  });

  it('returns undefined for unknown chain', () => {
    expect(chainIdToName(999)).toBeUndefined();
  });
});
