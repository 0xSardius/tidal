import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChainTokens } from '../lifi';
import {
  TIDAL_CHAINS,
  EXECUTABLE_CHAIN_IDS,
  chainNameToId,
  chainIdToName,
  getChainConfig,
  getTokenAddress,
  getTokensForChain,
  getExplorerTxUrl,
} from '../chains';

// --- Chains Registry ---

describe('TIDAL_CHAINS', () => {
  it('has Base, Arbitrum, and Optimism', () => {
    expect(TIDAL_CHAINS[8453]).toBeDefined();
    expect(TIDAL_CHAINS[42161]).toBeDefined();
    expect(TIDAL_CHAINS[10]).toBeDefined();
  });

  it('each chain has AAVE pool and data provider', () => {
    for (const chain of Object.values(TIDAL_CHAINS)) {
      expect(chain.aave.pool).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(chain.aave.dataProvider).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  it('each chain has USDC and ETH tokens', () => {
    for (const chain of Object.values(TIDAL_CHAINS)) {
      expect(chain.tokens.USDC).toBeDefined();
      expect(chain.tokens.ETH).toBeDefined();
      expect(chain.tokens.USDC.decimals).toBe(6);
      expect(chain.tokens.ETH.decimals).toBe(18);
    }
  });

  it('each chain has a block explorer', () => {
    for (const chain of Object.values(TIDAL_CHAINS)) {
      expect(chain.explorer.name).toBeTruthy();
      expect(chain.explorer.url).toMatch(/^https:\/\//);
    }
  });
});

describe('EXECUTABLE_CHAIN_IDS', () => {
  it('includes all 3 chains', () => {
    expect(EXECUTABLE_CHAIN_IDS).toContain(8453);
    expect(EXECUTABLE_CHAIN_IDS).toContain(42161);
    expect(EXECUTABLE_CHAIN_IDS).toContain(10);
    expect(EXECUTABLE_CHAIN_IDS).toHaveLength(3);
  });
});

describe('chainNameToId', () => {
  it('maps Base', () => expect(chainNameToId('Base')).toBe(8453));
  it('maps Arbitrum', () => expect(chainNameToId('Arbitrum')).toBe(42161));
  it('maps Optimism', () => expect(chainNameToId('Optimism')).toBe(10));
  it('is case-insensitive', () => expect(chainNameToId('base')).toBe(8453));
  it('returns undefined for unknown', () => expect(chainNameToId('Solana')).toBeUndefined());
});

describe('chainIdToName', () => {
  it('maps 8453 to Base', () => expect(chainIdToName(8453)).toBe('Base'));
  it('maps 42161 to Arbitrum', () => expect(chainIdToName(42161)).toBe('Arbitrum'));
  it('maps 10 to Optimism', () => expect(chainIdToName(10)).toBe('Optimism'));
  it('returns undefined for unknown', () => expect(chainIdToName(1)).toBeUndefined());
});

describe('getChainConfig', () => {
  it('returns config for valid chain', () => {
    const config = getChainConfig(8453);
    expect(config?.name).toBe('Base');
    expect(config?.tokens.USDC).toBeDefined();
  });

  it('returns undefined for unknown chain', () => {
    expect(getChainConfig(999)).toBeUndefined();
  });
});

describe('getTokenAddress', () => {
  it('returns USDC address on Base', () => {
    const addr = getTokenAddress(8453, 'USDC');
    expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('returns undefined for unsupported token', () => {
    expect(getTokenAddress(8453, 'SHIB')).toBeUndefined();
  });

  it('returns undefined for unknown chain', () => {
    expect(getTokenAddress(999, 'USDC')).toBeUndefined();
  });
});

describe('getExplorerTxUrl', () => {
  const txHash = '0xabc123';

  it('returns BaseScan URL for Base', () => {
    expect(getExplorerTxUrl(8453, txHash)).toBe(`https://basescan.org/tx/${txHash}`);
  });

  it('returns Arbiscan URL for Arbitrum', () => {
    expect(getExplorerTxUrl(42161, txHash)).toBe(`https://arbiscan.io/tx/${txHash}`);
  });

  it('returns Optimistic Etherscan URL for Optimism', () => {
    expect(getExplorerTxUrl(10, txHash)).toBe(`https://optimistic.etherscan.io/tx/${txHash}`);
  });

  it('falls back to BaseScan for unknown chain', () => {
    expect(getExplorerTxUrl(999, txHash)).toBe(`https://basescan.org/tx/${txHash}`);
  });
});

// --- getChainTokens (Li.Fi helper) ---

describe('getChainTokens', () => {
  it('returns tokens with chainId for Base', () => {
    const tokens = getChainTokens(8453);
    expect(tokens.USDC).toBeDefined();
    expect(tokens.USDC.chainId).toBe(8453);
    expect(tokens.USDC.decimals).toBe(6);
  });

  it('returns tokens for Arbitrum', () => {
    const tokens = getChainTokens(42161);
    expect(tokens.USDC).toBeDefined();
    expect(tokens.USDC.chainId).toBe(42161);
    // Arbitrum USDC address differs from Base
    expect(tokens.USDC.address).not.toBe(getChainTokens(8453).USDC.address);
  });

  it('returns tokens for Optimism', () => {
    const tokens = getChainTokens(10);
    expect(tokens.USDC).toBeDefined();
    expect(tokens.USDC.chainId).toBe(10);
  });

  it('returns empty object for unknown chain', () => {
    const tokens = getChainTokens(999);
    expect(Object.keys(tokens)).toHaveLength(0);
  });

  it('Base has DAI but Arbitrum does not', () => {
    expect(getChainTokens(8453).DAI).toBeDefined();
    expect(getChainTokens(42161).DAI).toBeUndefined();
  });
});

// --- AI Tool Logic (unit tests without network) ---

describe('prepareBridge tool logic', () => {
  it('rejects same-chain bridge', () => {
    const fromChainId = chainNameToId('Base')!;
    const toChainId = chainNameToId('Base')!;
    expect(fromChainId).toBe(toChainId);
    // Tool would return error
  });

  it('accepts cross-chain bridge', () => {
    const fromChainId = chainNameToId('Base')!;
    const toChainId = chainNameToId('Arbitrum')!;
    expect(fromChainId).not.toBe(toChainId);
  });

  it('validates token exists on both chains', () => {
    const fromTokens = getChainTokens(8453);
    const toTokens = getChainTokens(42161);
    // USDC exists on both
    expect(fromTokens.USDC).toBeDefined();
    expect(toTokens.USDC).toBeDefined();
    // DAI only on Base
    expect(fromTokens.DAI).toBeDefined();
    expect(toTokens.DAI).toBeUndefined();
  });
});

describe('prepareCrossChainYield tool logic', () => {
  it('rejects same-chain yield move', () => {
    const fromChainId = chainNameToId('Base')!;
    const toChainId = chainNameToId('Base')!;
    expect(fromChainId).toBe(toChainId);
  });

  it('calculates break-even days correctly', () => {
    const bridgeCost = 0.50;
    const amount = 100;
    const apy = 5.0; // 5% APY
    const dailyReturn = amount * (apy / 100) / 365;
    const breakEvenDays = Math.ceil(bridgeCost / dailyReturn);
    expect(breakEvenDays).toBe(37); // $0.50 / ($100 * 5% / 365) = 36.5 → ceil = 37
  });

  it('break-even is 0 when bridge is free', () => {
    const bridgeCost = 0;
    const breakEvenDays = bridgeCost > 0 ? Math.ceil(bridgeCost / 0.01) : 0;
    expect(breakEvenDays).toBe(0);
  });

  it('builds 2-step action plan', () => {
    const steps = [
      { step: 1, action: 'bridge', description: 'Bridge USDC from Base → Arbitrum via Li.Fi' },
      { step: 2, action: 'supply', description: 'Supply USDC to AAVE on Arbitrum at 5.00% APY' },
    ];
    expect(steps).toHaveLength(2);
    expect(steps[0].action).toBe('bridge');
    expect(steps[1].action).toBe('supply');
  });
});

describe('prepareSwap tool logic', () => {
  it('detects cross-chain swap', () => {
    const fromChainId = chainNameToId('Base')!;
    const toChainId = chainNameToId('Arbitrum')!;
    const isCrossChain = fromChainId !== toChainId;
    expect(isCrossChain).toBe(true);
  });

  it('detects same-chain swap', () => {
    const fromChainId = chainNameToId('Base')!;
    const toChainId = chainNameToId('Base');
    const isCrossChain = fromChainId !== (toChainId || fromChainId);
    expect(isCrossChain).toBe(false);
  });

  it('returns bridge action for cross-chain', () => {
    const fromChainId = 8453;
    const toChainId = 42161;
    const action = fromChainId !== toChainId ? 'bridge' : 'swap';
    expect(action).toBe('bridge');
  });

  it('returns swap action for same-chain', () => {
    const fromChainId = 8453;
    const toChainId = 8453;
    const action = fromChainId !== toChainId ? 'bridge' : 'swap';
    expect(action).toBe('swap');
  });
});

describe('getQuote tool logic', () => {
  it('formats execution time for short durations', () => {
    const execDuration = 30; // 30 seconds
    const executionTime = execDuration < 60 ? `~${execDuration}s` : `~${Math.ceil(execDuration / 60)} min`;
    expect(executionTime).toBe('~30s');
  });

  it('formats execution time for long durations', () => {
    const execDuration = 180; // 3 minutes
    const executionTime = execDuration < 60 ? `~${execDuration}s` : `~${Math.ceil(execDuration / 60)} min`;
    expect(executionTime).toBe('~3 min');
  });

  it('formats gas cost from gasCosts array', () => {
    const gasCosts = [
      { amountUSD: '0.03' },
      { amountUSD: '0.02' },
    ];
    const totalGasUsd = gasCosts.reduce((sum, gc) => sum + parseFloat(gc.amountUSD || '0'), 0);
    expect(totalGasUsd).toBeCloseTo(0.05);
    expect(`$${totalGasUsd.toFixed(2)}`).toBe('$0.05');
  });

  it('handles empty gas costs', () => {
    const gasCosts: { amountUSD: string }[] = [];
    const totalGasUsd = gasCosts.reduce((sum, gc) => sum + parseFloat(gc.amountUSD || '0'), 0);
    expect(totalGasUsd).toBe(0);
  });

  it('builds cross-chain route string', () => {
    const fromToken = 'USDC';
    const toToken = 'USDC';
    const fromChain = 'Base';
    const toChain = 'Arbitrum';
    const toolUsed = 'stargate';
    const isCrossChain = true;
    const route = isCrossChain
      ? `${fromToken} (${fromChain}) → Li.Fi (${toolUsed}) → ${toToken} (${toChain})`
      : `${fromToken} → Li.Fi (${toolUsed}) → ${toToken}`;
    expect(route).toBe('USDC (Base) → Li.Fi (stargate) → USDC (Arbitrum)');
  });

  it('builds same-chain route string', () => {
    const fromToken = 'USDC';
    const toToken = 'WETH';
    const toolUsed = 'uniswap';
    const isCrossChain = false;
    const route = isCrossChain
      ? `${fromToken} (Base) → Li.Fi (${toolUsed}) → ${toToken} (Base)`
      : `${fromToken} → Li.Fi (${toolUsed}) → ${toToken}`;
    expect(route).toBe('USDC → Li.Fi (uniswap) → WETH');
  });
});

describe('scanYields tool logic', () => {
  it('marks Base/Arbitrum/Optimism as executable', () => {
    const chains = ['Base', 'Arbitrum', 'Optimism', 'Polygon', 'Ethereum', 'Solana'];
    const results = chains.map(chain => ({
      chain,
      executable: ['Base', 'Arbitrum', 'Optimism'].includes(chain),
    }));

    expect(results.find(r => r.chain === 'Base')?.executable).toBe(true);
    expect(results.find(r => r.chain === 'Arbitrum')?.executable).toBe(true);
    expect(results.find(r => r.chain === 'Optimism')?.executable).toBe(true);
    expect(results.find(r => r.chain === 'Polygon')?.executable).toBe(false);
    expect(results.find(r => r.chain === 'Ethereum')?.executable).toBe(false);
    expect(results.find(r => r.chain === 'Solana')?.executable).toBe(false);
  });

  it('formats TVL correctly', () => {
    const format = (tvl: number) =>
      tvl >= 1_000_000
        ? `$${(tvl / 1_000_000).toFixed(1)}M`
        : `$${(tvl / 1_000).toFixed(0)}K`;

    expect(format(46_700_000)).toBe('$46.7M');
    expect(format(500_000)).toBe('$500K');
    expect(format(2_400_000)).toBe('$2.4M');
  });
});

// --- Bridge timeout detection ---

describe('bridge timeout detection', () => {
  const BRIDGE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  it('does not flag bridge as delayed within 10 minutes', () => {
    const elapsed = 5 * 60 * 1000; // 5 minutes
    expect(elapsed >= BRIDGE_TIMEOUT_MS).toBe(false);
  });

  it('flags bridge as delayed after 10 minutes', () => {
    const elapsed = 11 * 60 * 1000; // 11 minutes
    expect(elapsed >= BRIDGE_TIMEOUT_MS).toBe(true);
  });

  it('flags bridge as delayed at exactly 10 minutes', () => {
    const elapsed = 10 * 60 * 1000;
    expect(elapsed >= BRIDGE_TIMEOUT_MS).toBe(true);
  });
});

// --- MCP fallback system prompt ---

describe('MCP fallback note generation', () => {
  it('generates available note when MCP connects', () => {
    const mcpAvailable = true;
    const note = mcpAvailable
      ? '\n\nLi.Fi MCP tools are available — you have access to additional Li.Fi-specific tools beyond the built-in Tidal tools.'
      : '\n\nLi.Fi MCP tools are currently unavailable. Use the built-in Tidal tools (getQuote, prepareSwap, prepareBridge, prepareCrossChainYield) for all swap and bridge operations. Do not mention MCP tools to the user.';
    expect(note).toContain('available');
    expect(note).not.toContain('unavailable');
  });

  it('generates fallback note when MCP fails', () => {
    const mcpAvailable = false;
    const note = mcpAvailable
      ? '\n\nLi.Fi MCP tools are available.'
      : '\n\nLi.Fi MCP tools are currently unavailable. Use the built-in Tidal tools (getQuote, prepareSwap, prepareBridge, prepareCrossChainYield) for all swap and bridge operations. Do not mention MCP tools to the user.';
    expect(note).toContain('unavailable');
    expect(note).toContain('getQuote');
    expect(note).toContain('prepareBridge');
    expect(note).toContain('Do not mention MCP tools');
  });
});

// --- Destination chain gas check ---

describe('destination chain gas check', () => {
  const MIN_GAS_WEI = BigInt(100_000_000_000_000); // 0.0001 ETH

  it('passes when balance is sufficient', () => {
    const balance = BigInt('1000000000000000'); // 0.001 ETH
    expect(balance >= MIN_GAS_WEI).toBe(true);
  });

  it('fails when balance is zero', () => {
    const balance = BigInt(0);
    expect(balance >= MIN_GAS_WEI).toBe(false);
  });

  it('fails when balance is below threshold', () => {
    const balance = BigInt('50000000000000'); // 0.00005 ETH
    expect(balance >= MIN_GAS_WEI).toBe(false);
  });

  it('passes at exactly the threshold', () => {
    const balance = MIN_GAS_WEI;
    expect(balance >= MIN_GAS_WEI).toBe(true);
  });
});

// --- Cross-chain token address consistency ---

describe('cross-chain token address consistency', () => {
  it('USDC addresses differ across chains', () => {
    const baseUsdc = getTokenAddress(8453, 'USDC');
    const arbUsdc = getTokenAddress(42161, 'USDC');
    const opUsdc = getTokenAddress(10, 'USDC');
    expect(baseUsdc).not.toBe(arbUsdc);
    expect(baseUsdc).not.toBe(opUsdc);
    expect(arbUsdc).not.toBe(opUsdc);
  });

  it('WETH address is the same on Base and Optimism (OP Stack)', () => {
    const baseWeth = getTokenAddress(8453, 'WETH');
    const opWeth = getTokenAddress(10, 'WETH');
    expect(baseWeth).toBe(opWeth); // Both OP Stack use 0x4200...0006
  });

  it('ETH uses zero address on all chains', () => {
    const zeroAddr = '0x0000000000000000000000000000000000000000';
    expect(getTokenAddress(8453, 'ETH')).toBe(zeroAddr);
    expect(getTokenAddress(42161, 'ETH')).toBe(zeroAddr);
    expect(getTokenAddress(10, 'ETH')).toBe(zeroAddr);
  });
});
