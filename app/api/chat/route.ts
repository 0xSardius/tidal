import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { tidalTools } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { type RiskDepth } from '@/lib/constants';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();
    // Context comes from sendMessage({ data: { context } })
    const context = data?.context;

    // Build context from request
    const userContext = {
      riskDepth: (context?.riskDepth || 'shallows') as RiskDepth,
      walletConnected: context?.walletConnected ?? false,
      positions: context?.positions || [],
    };

    const marketContext = {
      rates: context?.rates,
      gasPrice: context?.gasPrice,
    };

    const systemPrompt = buildSystemPrompt(userContext, marketContext);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages,
      tools: tidalTools,
      // Pass context to tool execute functions
      // Use Base mainnet (8453) for Li.Fi - they don't support testnets
      experimental_context: {
        walletAddress: context?.walletAddress,
        chainId: context?.chainId || 8453, // Base mainnet for Li.Fi
        riskDepth: userContext.riskDepth,
      },
    });

    // AI SDK v6.0.64+: Use toUIMessageStreamResponse() for tools
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
