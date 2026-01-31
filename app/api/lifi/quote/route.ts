import { NextRequest, NextResponse } from 'next/server';
import { getSwapQuote } from '@/lib/lifi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { fromToken, toToken, fromAmount, fromChain, toChain, fromAddress } = body;

    // Validate required fields
    if (!fromToken || !toToken || !fromAmount || !fromChain || !toChain || !fromAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await getSwapQuote({
      fromToken,
      toToken,
      fromAmount,
      fromChain,
      toChain,
      fromAddress,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
