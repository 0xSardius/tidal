import { NextRequest, NextResponse } from 'next/server';
import { getSwapRoutes, describeRoute } from '@/lib/lifi';

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

    const result = await getSwapRoutes({
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

    // Add human-readable descriptions
    const routesWithDescriptions = result.routes?.map((route) => ({
      ...route,
      description: describeRoute(route),
    }));

    return NextResponse.json({
      success: true,
      routes: routesWithDescriptions,
    });
  } catch (error) {
    console.error('Routes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
