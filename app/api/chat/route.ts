import { streamText, convertToModelMessages } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { tidalTools } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { type RiskDepth } from '@/lib/constants';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    const { messages, data } = body;
    // Context comes from sendMessage({ body: { data: { context } } })
    const context = data?.context;

    console.log('Messages count:', messages?.length);
    console.log('First message:', messages?.[0]);

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

    // Include wallet context in system prompt for tools
    const walletInfo = context?.walletAddress
      ? `\n\nUser wallet: ${context.walletAddress}\nChain: Base (chainId: 8453)`
      : '\n\nUser wallet: Not connected';

    // Convert UI messages to model messages (async function!)
    const modelMessages = await convertToModelMessages(messages);
    console.log('Converted messages:', modelMessages?.length);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt + walletInfo,
      messages: modelMessages,
      tools: tidalTools,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
