import {
  createConfig,
  getQuote,
  getRoutes,
  executeRoute,
  convertQuoteToRoute,
  EVM,
  type Route,
  type LiFiStep,
  type QuoteRequest,
  type RoutesRequest
} from '@lifi/sdk';
import { base, baseSepolia } from 'viem/chains';
import { getWalletClient, switchChain } from '@wagmi/core';
import { wagmiConfig } from './wagmi';

// Initialize Li.Fi SDK with wagmi providers
let isConfigured = false;

export function configureLifi() {
  if (isConfigured) return;

  createConfig({
    integrator: 'tidal-defi',
    apiKey: process.env.LIFI_API_KEY,
    providers: [
      EVM({
        // Cast to any to handle type compatibility between wagmi and Li.Fi SDK
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getWalletClient: () => getWalletClient(wagmiConfig as any),
        switchChain: async (chainId) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chain = await switchChain(wagmiConfig as any, { chainId });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return getWalletClient(wagmiConfig as any, { chainId: chain.id });
        },
      }),
    ],
  });

  isConfigured = true;
}

// Initialize on module load for server-side (quote fetching only)
// Client-side will re-configure with wallet when needed
if (typeof window === 'undefined') {
  createConfig({
    integrator: 'tidal-defi',
    apiKey: process.env.LIFI_API_KEY,
  });
}

// Supported chains for Tidal
export const SUPPORTED_CHAINS = [base.id, baseSepolia.id];

// Common tokens on Base
export const BASE_TOKENS = {
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
    symbol: 'USDC',
    decimals: 6,
    chainId: base.id,
  },
  USDT: {
    address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as const,
    symbol: 'USDT',
    decimals: 6,
    chainId: base.id,
  },
  DAI: {
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as const,
    symbol: 'DAI',
    decimals: 18,
    chainId: base.id,
  },
  WETH: {
    address: '0x4200000000000000000000000000000000000006' as const,
    symbol: 'WETH',
    decimals: 18,
    chainId: base.id,
  },
  ETH: {
    address: '0x0000000000000000000000000000000000000000' as const,
    symbol: 'ETH',
    decimals: 18,
    chainId: base.id,
  },
} as const;

export type TokenSymbol = keyof typeof BASE_TOKENS;

/**
 * Get a quote for a token swap
 */
export async function getSwapQuote(params: {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromChain: number;
  toChain: number;
  fromAddress: string;
}) {
  const request: QuoteRequest = {
    fromChain: params.fromChain,
    toChain: params.toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    // Slippage in basis points (0.5%)
    slippage: 0.005,
  };

  try {
    const quote = await getQuote(request);
    return {
      success: true,
      quote,
      estimate: {
        fromAmount: quote.estimate.fromAmount,
        toAmount: quote.estimate.toAmount,
        toAmountMin: quote.estimate.toAmountMin,
        gasCosts: quote.estimate.gasCosts,
        executionDuration: quote.estimate.executionDuration,
      },
    };
  } catch (error) {
    console.error('Li.Fi quote error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quote',
    };
  }
}

/**
 * Get available routes for a swap (shows multiple options)
 */
export async function getSwapRoutes(params: {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromChain: number;
  toChain: number;
  fromAddress: string;
}) {
  const request: RoutesRequest = {
    fromChainId: params.fromChain,
    toChainId: params.toChain,
    fromTokenAddress: params.fromToken,
    toTokenAddress: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    options: {
      slippage: 0.005,
      order: 'RECOMMENDED',
    },
  };

  try {
    const result = await getRoutes(request);
    return {
      success: true,
      routes: result.routes,
    };
  } catch (error) {
    console.error('Li.Fi routes error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get routes',
    };
  }
}

/**
 * Execute a swap route - must be called from client-side with wallet connected
 */
export async function executeSwapRoute(
  route: Route,
  updateCallback?: (status: RouteExecutionStatus) => void
) {
  // Ensure Li.Fi is configured with wallet providers
  configureLifi();

  try {
    const result = await executeRoute(route, {
      updateRouteHook: (updatedRoute) => {
        // Track execution progress
        const status = getRouteExecutionStatus(updatedRoute);
        updateCallback?.(status);
      },
    });
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('Li.Fi execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute swap',
    };
  }
}

/**
 * Execute a swap from a quote - converts quote to route first
 */
export async function executeSwapFromQuote(
  quote: LiFiStep,
  updateCallback?: (status: RouteExecutionStatus) => void
) {
  // Ensure Li.Fi is configured with wallet providers
  configureLifi();

  try {
    // Convert quote to route format
    const route = convertQuoteToRoute(quote);

    const result = await executeRoute(route, {
      updateRouteHook: (updatedRoute) => {
        const status = getRouteExecutionStatus(updatedRoute);
        updateCallback?.(status);
      },
    });
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('Li.Fi execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute swap',
    };
  }
}

export interface RouteExecutionStatus {
  status: 'pending' | 'executing' | 'completed' | 'failed';
  txHash?: string;
  message: string;
}

function getRouteExecutionStatus(route: Route): RouteExecutionStatus {
  const step = route.steps[0];
  if (!step) {
    return { status: 'pending', message: 'Preparing transaction...' };
  }

  // Check if step has execution info (may be added during execution)
  const stepWithExecution = step as typeof step & {
    execution?: {
      status: string;
      process: Array<{ txHash?: string; message?: string }>;
    };
  };

  const execution = stepWithExecution.execution;
  if (!execution) {
    return { status: 'pending', message: 'Waiting for signature...' };
  }

  if (execution.status === 'DONE') {
    return {
      status: 'completed',
      txHash: execution.process[0]?.txHash,
      message: 'Swap completed!',
    };
  }

  if (execution.status === 'FAILED') {
    return {
      status: 'failed',
      message: execution.process[0]?.message || 'Transaction failed',
    };
  }

  return {
    status: 'executing',
    txHash: execution.process[0]?.txHash,
    message: 'Transaction in progress...',
  };
}

/**
 * Format route for display - shows which DEXs/bridges are used
 */
export function formatRouteSteps(route: Route) {
  return route.steps.map((step) => ({
    tool: step.tool,
    toolDetails: step.toolDetails,
    type: step.type,
    fromToken: step.action.fromToken,
    toToken: step.action.toToken,
    fromAmount: step.action.fromAmount,
    toAmount: step.estimate.toAmount,
  }));
}

/**
 * Get human-readable route description for the AI agent
 */
export function describeRoute(route: Route): string {
  const steps = route.steps;
  if (steps.length === 0) return 'No route steps';

  const descriptions = steps.map((step) => {
    const tool = step.toolDetails?.name || step.tool;
    const from = step.action.fromToken.symbol;
    const to = step.action.toToken.symbol;
    return `${from} → ${to} via ${tool}`;
  });

  const totalGas = route.gasCostUSD ? `$${parseFloat(route.gasCostUSD).toFixed(2)} gas` : '';
  const duration = route.steps[0]?.estimate?.executionDuration
    ? `~${Math.ceil(route.steps[0].estimate.executionDuration / 60)} min`
    : '';

  return `${descriptions.join(' → ')} (${[totalGas, duration].filter(Boolean).join(', ')})`;
}

// Re-export types for use in other files
export type { Route, LiFiStep };
