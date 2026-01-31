import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import {
  AAVE_DATA_PROVIDER_ABI,
  getAaveAddresses,
  rayToApy,
  type AaveToken,
} from '@/lib/aave';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
});

const TOKENS: AaveToken[] = ['USDC', 'WETH'];

export async function GET() {
  try {
    const addresses = getAaveAddresses(baseSepolia.id);
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
          apy: Math.round(apy * 100) / 100, // Round to 2 decimals
          token,
        };
      } catch (err) {
        console.error(`Failed to fetch rate for ${token}:`, err);
        // Use fallback rate
        rates[token] = {
          apy: token === 'USDC' ? 3.5 : 2.1, // Fallback rates
          token,
        };
      }
    }

    return NextResponse.json({
      success: true,
      rates,
      timestamp: Date.now(),
      chain: 'base-sepolia',
    });
  } catch (error) {
    console.error('AAVE rates API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch AAVE rates',
        // Return fallback rates
        rates: {
          USDC: { apy: 3.5, token: 'USDC' },
          WETH: { apy: 2.1, token: 'WETH' },
        },
      },
      { status: 500 }
    );
  }
}
