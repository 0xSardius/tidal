import { NextResponse } from 'next/server';
import { getYieldChainNames } from '@/lib/constants';

interface DefiLlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  rewardTokens: string[] | null;
  underlyingTokens: string[] | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  apyMean30d: number | null;
  predictions: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  } | null;
}

export interface YieldOpportunity {
  id: string;
  chain: string;
  protocol: string;
  symbol: string;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  tvlUsd: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  apyMean30d: number | null;
  riskLevel: 1 | 2 | 3;
}

// In-memory cache
let cachedData: { pools: YieldOpportunity[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Map DeFi Llama pool to a risk level for our tier system
export function assessRisk(pool: DefiLlamaPool): 1 | 2 | 3 {
  // Level 1 (Shallows): AAVE + conservative Morpho - stablecoins, single exposure, no IL, high TVL
  // Battle-tested protocols with institutional-grade risk management
  if (
    pool.stablecoin &&
    pool.exposure === 'single' &&
    pool.ilRisk === 'no' &&
    pool.tvlUsd > 10_000_000 &&
    ['aave-v3', 'morpho-v1'].includes(pool.project)
  ) {
    return 1;
  }

  // Level 2 (Mid-Depth): Single exposure, no IL, decent TVL - includes reward-boosted vaults, ETH strategies
  if (
    pool.exposure === 'single' &&
    pool.ilRisk === 'no' &&
    pool.tvlUsd > 1_000_000
  ) {
    return 2;
  }

  // Level 3 (Deep Water): Everything else (LP, IL risk, low TVL, etc.)
  return 3;
}

// Pure filter function for testability
export function filterPools(
  pools: YieldOpportunity[],
  options: {
    token?: string;
    maxRisk?: number;
    chains?: string[];
    limit?: number;
  }
): YieldOpportunity[] {
  const { token, maxRisk = 3, chains, limit = 10 } = options;
  const supportedChains = getYieldChainNames();

  let filtered = pools;

  // Filter by chains
  if (chains && chains.length > 0) {
    filtered = filtered.filter((p) => chains.includes(p.chain));
  } else {
    // Default: all supported chains
    filtered = filtered.filter((p) => supportedChains.includes(p.chain));
  }

  if (token) {
    filtered = filtered.filter((p) => p.symbol.includes(token));
  }

  if (maxRisk < 3) {
    filtered = filtered.filter((p) => p.riskLevel <= maxRisk);
  }

  return filtered.slice(0, limit);
}

async function fetchAndCachePools(): Promise<YieldOpportunity[]> {
  // Return cache if fresh
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.pools;
  }

  const response = await fetch('https://yields.llama.fi/pools', {
    next: { revalidate: 300 }, // Next.js fetch cache: 5 min
  });

  if (!response.ok) {
    throw new Error(`DeFi Llama API error: ${response.status}`);
  }

  const json = await response.json();
  const allPools: DefiLlamaPool[] = json.data;

  const supportedChains = getYieldChainNames();

  // Filter for supported chains, positive APY, reasonable TVL
  const validPools = allPools.filter(
    (p) =>
      supportedChains.includes(p.chain) &&
      p.apy > 0 &&
      p.apy < 100 && // Filter out obvious outliers/broken data
      p.tvlUsd > 100_000 // Minimum $100k TVL
  );

  // Map to our format
  const opportunities: YieldOpportunity[] = validPools.map((p) => ({
    id: p.pool,
    chain: p.chain,
    protocol: p.project,
    symbol: p.symbol,
    apy: Math.round(p.apy * 100) / 100,
    apyBase: p.apyBase ? Math.round(p.apyBase * 100) / 100 : null,
    apyReward: p.apyReward ? Math.round(p.apyReward * 100) / 100 : null,
    tvlUsd: Math.round(p.tvlUsd),
    stablecoin: p.stablecoin,
    ilRisk: p.ilRisk,
    exposure: p.exposure,
    apyMean30d: p.apyMean30d ? Math.round(p.apyMean30d * 100) / 100 : null,
    riskLevel: assessRisk(p),
  }));

  // Sort by APY descending
  opportunities.sort((a, b) => b.apy - a.apy);

  // Cache the result
  cachedData = { pools: opportunities, timestamp: Date.now() };

  return opportunities;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token')?.toUpperCase(); // e.g., "USDC"
    const maxRisk = parseInt(searchParams.get('maxRisk') || '3'); // 1, 2, or 3
    const limit = parseInt(searchParams.get('limit') || '10');
    const chainsParam = searchParams.get('chains'); // e.g., "Base,Arbitrum"
    const chains = chainsParam ? chainsParam.split(',').map(c => c.trim()) : undefined;

    const pools = await fetchAndCachePools();

    const results = filterPools(pools, { token, maxRisk, chains, limit });

    // Collect unique chains in the results
    const resultChains = [...new Set(results.map(r => r.chain))];

    return NextResponse.json({
      success: true,
      opportunities: results,
      total: results.length,
      timestamp: Date.now(),
      chains: resultChains,
    });
  } catch (error) {
    console.error('Yields API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch yield data',
        opportunities: [],
      },
      { status: 500 }
    );
  }
}
