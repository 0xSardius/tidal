import { type RiskDepth, RISK_DEPTHS } from './constants';

/**
 * Strategy types that map to risk depth allowedStrategies
 */
export type StrategyType =
  | 'stablecoin-lending'
  | 'single-asset-lending'
  | 'lp-positions'
  | 'leverage';

/**
 * Supported tokens for yield strategies
 */
export type SupportedToken = 'USDC' | 'DAI' | 'ETH' | 'WETH';

/**
 * Yield strategy definition
 */
export interface YieldStrategy {
  id: string;
  name: string;
  protocol: 'AAVE' | 'Yearn' | 'Compound';
  type: StrategyType;
  riskLevel: 1 | 2 | 3; // Maps to Shallows (1), Mid-Depth (2), Deep Water (3)
  acceptedTokens: SupportedToken[];
  targetToken: SupportedToken; // Token needed for this strategy
  description: string;
  // APY will be fetched dynamically
  getApy?: () => Promise<number>;
}

/**
 * All available yield strategies
 */
export const YIELD_STRATEGIES: YieldStrategy[] = [
  // === SHALLOWS (Risk Level 1) - Stablecoin Lending ===
  {
    id: 'aave-usdc',
    name: 'AAVE USDC Lending',
    protocol: 'AAVE',
    type: 'stablecoin-lending',
    riskLevel: 1,
    acceptedTokens: ['USDC'],
    targetToken: 'USDC',
    description: 'Supply USDC to AAVE for stable yield. Battle-tested protocol, high liquidity.',
  },
  {
    id: 'aave-dai',
    name: 'AAVE DAI Lending',
    protocol: 'AAVE',
    type: 'stablecoin-lending',
    riskLevel: 1,
    acceptedTokens: ['DAI'],
    targetToken: 'DAI',
    description: 'Supply DAI to AAVE for stable yield. Decentralized stablecoin option.',
  },

  // === MID-DEPTH (Risk Level 2) - Single Asset Lending ===
  {
    id: 'aave-eth',
    name: 'AAVE ETH Lending',
    protocol: 'AAVE',
    type: 'single-asset-lending',
    riskLevel: 2,
    acceptedTokens: ['ETH', 'WETH'],
    targetToken: 'WETH',
    description: 'Supply ETH to AAVE. Higher volatility but potential for appreciation.',
  },

  // === DEEP WATER (Risk Level 3) - Complex Strategies ===
  // For MVP, we'll use multi-step combos that combine Li.Fi + AAVE
  {
    id: 'eth-to-stable-yield',
    name: 'ETH → Stablecoin Yield',
    protocol: 'AAVE',
    type: 'stablecoin-lending', // End result is stablecoin lending
    riskLevel: 3,
    acceptedTokens: ['ETH', 'WETH'],
    targetToken: 'USDC',
    description: 'Convert ETH to USDC via Li.Fi, then supply to AAVE. Locks in value + earns yield.',
  },
];

/**
 * Get strategies available for a given risk depth
 */
export function getStrategiesForDepth(depth: RiskDepth): YieldStrategy[] {
  const depthConfig = RISK_DEPTHS[depth];
  const allowedTypes = depthConfig.allowedStrategies as readonly string[];
  const maxRisk = depthConfig.maxRisk;

  return YIELD_STRATEGIES.filter(
    (strategy) =>
      strategy.riskLevel <= maxRisk &&
      allowedTypes.includes(strategy.type)
  );
}

/**
 * Get strategies that can accept a specific token
 */
export function getStrategiesForToken(
  token: SupportedToken,
  depth: RiskDepth
): YieldStrategy[] {
  const availableStrategies = getStrategiesForDepth(depth);
  return availableStrategies.filter((s) => s.acceptedTokens.includes(token));
}

/**
 * Check if a swap is needed for a strategy
 */
export function needsSwap(
  userToken: SupportedToken,
  strategy: YieldStrategy
): boolean {
  // If user has ETH and strategy needs WETH, no swap needed (handled by protocol)
  if (userToken === 'ETH' && strategy.targetToken === 'WETH') return false;
  if (userToken === 'WETH' && strategy.targetToken === 'ETH') return false;

  return userToken !== strategy.targetToken;
}

/**
 * Get the best strategy recommendation for a user
 */
export function recommendStrategy(
  userToken: SupportedToken,
  amount: number,
  depth: RiskDepth,
  apyData?: Record<string, number>
): {
  strategy: YieldStrategy;
  needsSwap: boolean;
  swapPath?: { from: SupportedToken; to: SupportedToken };
  reasoning: string;
} | null {
  const strategies = getStrategiesForDepth(depth);

  if (strategies.length === 0) {
    return null;
  }

  // First, check for direct deposit strategies (no swap needed)
  const directStrategies = strategies.filter(
    (s) => s.acceptedTokens.includes(userToken) && !needsSwap(userToken, s)
  );

  if (directStrategies.length > 0) {
    // Sort by APY if available, otherwise use first
    const best = apyData
      ? directStrategies.sort((a, b) => (apyData[b.id] || 0) - (apyData[a.id] || 0))[0]
      : directStrategies[0];

    return {
      strategy: best,
      needsSwap: false,
      reasoning: `Direct deposit to ${best.name} - no swap needed, keeping it simple.`,
    };
  }

  // If no direct match, find strategies that require a swap
  const swapStrategies = strategies.filter((s) => needsSwap(userToken, s));

  if (swapStrategies.length > 0) {
    const best = apyData
      ? swapStrategies.sort((a, b) => (apyData[b.id] || 0) - (apyData[a.id] || 0))[0]
      : swapStrategies[0];

    return {
      strategy: best,
      needsSwap: true,
      swapPath: { from: userToken, to: best.targetToken },
      reasoning: `Routing ${userToken} → ${best.targetToken} via Li.Fi for optimal rates, then depositing to ${best.name}.`,
    };
  }

  return null;
}

/**
 * Format strategy for AI agent context
 */
export function describeStrategy(strategy: YieldStrategy, apy?: number): string {
  const apyStr = apy ? `${apy.toFixed(2)}% APY` : 'APY loading...';
  return `${strategy.name} (${strategy.protocol}) - ${apyStr}: ${strategy.description}`;
}

/**
 * Get all strategies formatted for AI agent context
 */
export function getStrategiesContext(
  depth: RiskDepth,
  apyData?: Record<string, number>
): string {
  const strategies = getStrategiesForDepth(depth);
  const lines = strategies.map((s) => describeStrategy(s, apyData?.[s.id]));
  return lines.join('\n');
}
