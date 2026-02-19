import { describe, it, expect } from 'vitest';
import { BASE_TOKENS, describeRoute, formatRouteSteps } from '../lifi';
import type { Route } from '../lifi';

// --- BASE_TOKENS ---

describe('BASE_TOKENS', () => {
  it('has all expected tokens', () => {
    expect(BASE_TOKENS.USDC).toBeDefined();
    expect(BASE_TOKENS.USDT).toBeDefined();
    expect(BASE_TOKENS.DAI).toBeDefined();
    expect(BASE_TOKENS.WETH).toBeDefined();
    expect(BASE_TOKENS.ETH).toBeDefined();
  });

  it('USDC has correct decimals and address', () => {
    expect(BASE_TOKENS.USDC.decimals).toBe(6);
    expect(BASE_TOKENS.USDC.symbol).toBe('USDC');
    expect(BASE_TOKENS.USDC.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(BASE_TOKENS.USDC.chainId).toBe(8453);
  });

  it('WETH has correct decimals', () => {
    expect(BASE_TOKENS.WETH.decimals).toBe(18);
    expect(BASE_TOKENS.WETH.symbol).toBe('WETH');
  });

  it('ETH uses the zero address', () => {
    expect(BASE_TOKENS.ETH.address).toBe('0x0000000000000000000000000000000000000000');
    expect(BASE_TOKENS.ETH.decimals).toBe(18);
  });

  it('DAI has 18 decimals', () => {
    expect(BASE_TOKENS.DAI.decimals).toBe(18);
  });

  it('USDT has 6 decimals', () => {
    expect(BASE_TOKENS.USDT.decimals).toBe(6);
  });

  it('all tokens have Base chain ID', () => {
    for (const token of Object.values(BASE_TOKENS)) {
      expect(token.chainId).toBe(8453);
    }
  });
});

// --- describeRoute ---

// Helper to build a mock Route with the minimal shape needed
function mockRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'test-route',
    fromChainId: 8453,
    fromAmountUSD: '100',
    fromAmount: '100000000',
    fromToken: { symbol: 'USDC' } as Route['fromToken'],
    fromAddress: '0x1234',
    toChainId: 8453,
    toAmountUSD: '99.50',
    toAmount: '99500000',
    toAmountMin: '99000000',
    toToken: { symbol: 'WETH' } as Route['toToken'],
    toAddress: '0x1234',
    gasCostUSD: '0.05',
    steps: [
      {
        id: 'step-1',
        type: 'swap',
        tool: 'uniswap',
        toolDetails: { key: 'uniswap', name: 'Uniswap V3', logoURI: '' },
        action: {
          fromToken: { symbol: 'USDC' },
          toToken: { symbol: 'WETH' },
          fromAmount: '100000000',
          fromChainId: 8453,
          toChainId: 8453,
          slippage: 0.005,
          fromAddress: '0x1234',
          toAddress: '0x1234',
        },
        estimate: {
          fromAmount: '100000000',
          toAmount: '50000000000000000',
          toAmountMin: '49750000000000000',
          approvalAddress: '0x0000',
          executionDuration: 30,
          gasCosts: [],
          feeCosts: [],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ],
    tags: [],
    ...overrides,
  } as Route;
}

describe('describeRoute', () => {
  it('describes a single-step route', () => {
    const route = mockRoute();
    const desc = describeRoute(route);
    expect(desc).toContain('USDC');
    expect(desc).toContain('WETH');
    expect(desc).toContain('Uniswap V3');
  });

  it('includes gas cost', () => {
    const route = mockRoute({ gasCostUSD: '0.12' });
    const desc = describeRoute(route);
    expect(desc).toContain('$0.12');
    expect(desc).toContain('gas');
  });

  it('includes execution duration', () => {
    const route = mockRoute();
    const desc = describeRoute(route);
    expect(desc).toContain('min');
  });

  it('handles empty steps', () => {
    const route = mockRoute({ steps: [] });
    const desc = describeRoute(route);
    expect(desc).toBe('No route steps');
  });

  it('falls back to tool key when toolDetails missing', () => {
    const route = mockRoute();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (route.steps[0] as any).toolDetails = undefined;
    const desc = describeRoute(route);
    expect(desc).toContain('uniswap');
  });
});

// --- formatRouteSteps ---

describe('formatRouteSteps', () => {
  it('returns formatted step objects', () => {
    const route = mockRoute();
    const steps = formatRouteSteps(route);
    expect(steps).toHaveLength(1);
    expect(steps[0].tool).toBe('uniswap');
    expect(steps[0].type).toBe('swap');
    expect(steps[0].fromToken).toBeDefined();
    expect(steps[0].toToken).toBeDefined();
  });

  it('returns empty array for empty steps', () => {
    const route = mockRoute({ steps: [] });
    const steps = formatRouteSteps(route);
    expect(steps).toHaveLength(0);
  });
});
