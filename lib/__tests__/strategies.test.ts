import { describe, it, expect } from 'vitest';
import {
  YIELD_STRATEGIES,
  getStrategiesForDepth,
  getStrategiesForToken,
  needsSwap,
  recommendStrategy,
  describeStrategy,
  getStrategiesContext,
} from '../strategies';

// --- YIELD_STRATEGIES validation ---

describe('YIELD_STRATEGIES', () => {
  it('has at least 3 strategies', () => {
    expect(YIELD_STRATEGIES.length).toBeGreaterThanOrEqual(3);
  });

  it('every strategy has required fields', () => {
    for (const s of YIELD_STRATEGIES) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.protocol).toBeTruthy();
      expect(s.type).toBeTruthy();
      expect([1, 2, 3]).toContain(s.riskLevel);
      expect(s.acceptedTokens.length).toBeGreaterThan(0);
      expect(s.targetToken).toBeTruthy();
      expect(s.description).toBeTruthy();
    }
  });

  it('has strategies at each risk level', () => {
    expect(YIELD_STRATEGIES.some(s => s.riskLevel === 1)).toBe(true);
    expect(YIELD_STRATEGIES.some(s => s.riskLevel === 2)).toBe(true);
    expect(YIELD_STRATEGIES.some(s => s.riskLevel === 3)).toBe(true);
  });

  it('has unique IDs', () => {
    const ids = YIELD_STRATEGIES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// --- getStrategiesForDepth ---

describe('getStrategiesForDepth', () => {
  it('returns only risk-1 strategies for Shallows', () => {
    const strategies = getStrategiesForDepth('shallows');
    expect(strategies.length).toBeGreaterThan(0);
    strategies.forEach(s => expect(s.riskLevel).toBe(1));
  });

  it('returns risk-1 and risk-2 strategies for Mid-Depth', () => {
    const strategies = getStrategiesForDepth('mid-depth');
    expect(strategies.length).toBeGreaterThan(0);
    strategies.forEach(s => expect(s.riskLevel).toBeLessThanOrEqual(2));
    // Should include more than just Shallows
    expect(strategies.length).toBeGreaterThanOrEqual(
      getStrategiesForDepth('shallows').length
    );
  });

  it('returns all strategies for Deep Water', () => {
    const strategies = getStrategiesForDepth('deep-water');
    expect(strategies.length).toBeGreaterThanOrEqual(
      getStrategiesForDepth('mid-depth').length
    );
  });

  it('respects allowed strategy types per tier', () => {
    const shallows = getStrategiesForDepth('shallows');
    // Shallows only allows 'stablecoin-lending'
    shallows.forEach(s => expect(s.type).toBe('stablecoin-lending'));
  });
});

// --- getStrategiesForToken ---

describe('getStrategiesForToken', () => {
  it('returns USDC strategies for Shallows', () => {
    const strategies = getStrategiesForToken('USDC', 'shallows');
    expect(strategies.length).toBeGreaterThan(0);
    strategies.forEach(s => expect(s.acceptedTokens).toContain('USDC'));
  });

  it('returns ETH strategies for Mid-Depth', () => {
    const strategies = getStrategiesForToken('ETH', 'mid-depth');
    expect(strategies.length).toBeGreaterThan(0);
    strategies.forEach(s => expect(s.acceptedTokens).toContain('ETH'));
  });

  it('returns empty for tokens with no strategies at tier', () => {
    // ETH has no stablecoin-lending strategies (Shallows only allows stablecoin-lending)
    const strategies = getStrategiesForToken('ETH', 'shallows');
    expect(strategies).toHaveLength(0);
  });

  it('returns WETH strategies for Deep Water', () => {
    const strategies = getStrategiesForToken('WETH', 'deep-water');
    expect(strategies.length).toBeGreaterThan(0);
  });
});

// --- needsSwap ---

describe('needsSwap', () => {
  const usdcStrategy = YIELD_STRATEGIES.find(s => s.targetToken === 'USDC' && s.riskLevel === 1)!;
  const wethStrategy = YIELD_STRATEGIES.find(s => s.targetToken === 'WETH')!;

  it('returns false when user token matches target', () => {
    expect(needsSwap('USDC', usdcStrategy)).toBe(false);
  });

  it('returns true when user token differs from target', () => {
    expect(needsSwap('ETH', usdcStrategy)).toBe(true);
  });

  it('returns false for ETH→WETH (protocol handles wrapping)', () => {
    expect(needsSwap('ETH', wethStrategy)).toBe(false);
  });

  it('returns false for WETH→ETH (protocol handles unwrapping)', () => {
    // Create a mock strategy targeting ETH
    const ethTarget = { ...usdcStrategy, targetToken: 'ETH' as const };
    expect(needsSwap('WETH', ethTarget)).toBe(false);
  });

  it('returns true for USDC→WETH', () => {
    expect(needsSwap('USDC', wethStrategy)).toBe(true);
  });
});

// --- recommendStrategy ---

describe('recommendStrategy', () => {
  it('recommends a strategy for USDC at Shallows', () => {
    const result = recommendStrategy('USDC', 1000, 'shallows');
    expect(result).not.toBeNull();
    expect(result!.strategy.riskLevel).toBe(1);
    expect(result!.needsSwap).toBe(false);
  });

  it('recommends a strategy for ETH at Mid-Depth', () => {
    const result = recommendStrategy('ETH', 1, 'mid-depth');
    expect(result).not.toBeNull();
    expect(result!.strategy.acceptedTokens).toContain('ETH');
  });

  it('recommends swap path when needed', () => {
    const result = recommendStrategy('ETH', 1, 'shallows');
    // ETH at Shallows: only stablecoin strategies, so needs swap
    if (result) {
      expect(result.needsSwap).toBe(true);
      expect(result.swapPath).toBeDefined();
      expect(result.swapPath!.from).toBe('ETH');
    }
  });

  it('includes reasoning in result', () => {
    const result = recommendStrategy('USDC', 100, 'shallows');
    expect(result).not.toBeNull();
    expect(result!.reasoning).toBeTruthy();
    expect(result!.reasoning.length).toBeGreaterThan(10);
  });

  it('prefers higher APY when data is provided', () => {
    const apyData = {
      'aave-usdc': 4.0,
      'aave-dai': 3.5,
    };
    const result = recommendStrategy('USDC', 100, 'shallows', apyData);
    expect(result).not.toBeNull();
    expect(result!.strategy.id).toBe('aave-usdc');
  });

  it('returns direct deposit when available', () => {
    const result = recommendStrategy('USDC', 100, 'shallows');
    expect(result).not.toBeNull();
    expect(result!.needsSwap).toBe(false);
    expect(result!.reasoning).toContain('Direct deposit');
  });
});

// --- describeStrategy ---

describe('describeStrategy', () => {
  const strategy = YIELD_STRATEGIES[0];

  it('includes strategy name and protocol', () => {
    const desc = describeStrategy(strategy);
    expect(desc).toContain(strategy.name);
    expect(desc).toContain(strategy.protocol);
  });

  it('includes APY when provided', () => {
    const desc = describeStrategy(strategy, 4.5);
    expect(desc).toContain('4.50%');
    expect(desc).toContain('APY');
  });

  it('shows loading when no APY', () => {
    const desc = describeStrategy(strategy);
    expect(desc).toContain('loading');
  });

  it('includes description', () => {
    const desc = describeStrategy(strategy, 3.0);
    expect(desc).toContain(strategy.description);
  });
});

// --- getStrategiesContext ---

describe('getStrategiesContext', () => {
  it('returns non-empty string for each depth', () => {
    expect(getStrategiesContext('shallows').length).toBeGreaterThan(0);
    expect(getStrategiesContext('mid-depth').length).toBeGreaterThan(0);
    expect(getStrategiesContext('deep-water').length).toBeGreaterThan(0);
  });

  it('includes APY data when provided', () => {
    const ctx = getStrategiesContext('shallows', { 'aave-usdc': 4.2 });
    expect(ctx).toContain('4.20%');
  });

  it('Deep Water context is longer than Shallows (more strategies)', () => {
    const shallows = getStrategiesContext('shallows');
    const deep = getStrategiesContext('deep-water');
    expect(deep.length).toBeGreaterThan(shallows.length);
  });
});
