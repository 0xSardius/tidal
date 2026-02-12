import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import {
  AAVE_DATA_PROVIDER_ABI,
  getAaveAddresses,
  rayToApy,
  type AaveToken,
} from '@/lib/aave';

const client = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || 'https://mainnet.base.org'),
});

const TOKENS: AaveToken[] = ['USDC', 'WETH'];

// In-memory cache (same pattern as /api/yields)
let cachedRates: { rates: Record<string, { apy: number; token: string }>; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchAndCacheRates(): Promise<Record<string, { apy: number; token: string }>> {
  if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_TTL) {
    return cachedRates.rates;
  }

  const addresses = getAaveAddresses(base.id);
  const rates: Record<string, { apy: number; token: string }> = {};

  for (const token of TOKENS) {
    const tokenAddress = addresses.tokens[token as keyof typeof addresses.tokens];
    if (!tokenAddress) continue;

    try {
      const data = await client.readContract({
        address: addresses.dataProvider,
        abi: AAVE_DATA_PROVIDER_ABI,
        functionName: 'getReserveData',
        args: [tokenAddress],
      });

      const liquidityRate = data[5]; // Index 5 is liquidityRate
      const apy = rayToApy(liquidityRate);

      rates[token] = {
        apy: Math.round(apy * 100) / 100,
        token,
      };
    } catch (err) {
      console.error(`Failed to fetch rate for ${token}:`, err);
      rates[token] = {
        apy: token === 'USDC' ? 3.5 : 2.1,
        token,
      };
    }
  }

  cachedRates = { rates, timestamp: Date.now() };
  return rates;
}

export async function GET() {
  try {
    const rates = await fetchAndCacheRates();

    return NextResponse.json({
      success: true,
      rates,
      timestamp: cachedRates?.timestamp ?? Date.now(),
      chain: 'base-mainnet',
    });
  } catch (error) {
    console.error('AAVE rates API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch AAVE rates',
        rates: {
          USDC: { apy: 3.5, token: 'USDC' },
          WETH: { apy: 2.1, token: 'WETH' },
        },
      },
      { status: 500 }
    );
  }
}
