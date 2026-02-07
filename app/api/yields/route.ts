import { NextResponse } from 'next/server';

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
function assessRisk(pool: DefiLlamaPool): 1 | 2 | 3 {
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

  // Filter for Base chain, positive APY, reasonable TVL
  const basePools = allPools.filter(
    (p) =>
      p.chain === 'Base' &&
      p.apy > 0 &&
      p.apy < 100 && // Filter out obvious outliers/broken data
      p.tvlUsd > 100_000 // Minimum $100k TVL
  );

  // Map to our format
  const opportunities: YieldOpportunity[] = basePools.map((p) => ({
    id: p.pool,
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

    const pools = await fetchAndCachePools();

    // Apply filters
    let filtered = pools;

    if (token) {
      filtered = filtered.filter((p) => p.symbol.includes(token));
    }

    if (maxRisk < 3) {
      filtered = filtered.filter((p) => p.riskLevel <= maxRisk);
    }

    // Limit results
    const results = filtered.slice(0, limit);

    return NextResponse.json({
      success: true,
      opportunities: results,
      total: filtered.length,
      timestamp: Date.now(),
      chain: 'Base',
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
