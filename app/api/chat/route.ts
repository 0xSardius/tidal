import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { tidalTools } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { type RiskDepth } from '@/lib/constants';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

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

    // Track session in DB (fire-and-forget)
    const sessionId = data?.sessionId;
    if (db && sessionId) {
      const toolNames = (messages ?? [])
        .flatMap((m: Record<string, unknown>) => {
          const parts = m.parts as Array<{ type: string; toolName?: string }> | undefined;
          return (parts ?? [])
            .filter((p) => p.type?.startsWith('tool-') || p.type === 'dynamic-tool')
            .map((p) => p.toolName)
            .filter(Boolean);
        }) as string[];

      const wallet = context?.walletAddress?.toLowerCase();

      // Upsert session
      db.select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1)
        .then((existing) => {
          if (existing.length > 0) {
            const currentTools = (existing[0].toolsUsed ?? []) as string[];
            const mergedTools = [...new Set([...currentTools, ...toolNames])];
            return db!
              .update(sessions)
              .set({
                messageCount: sql`${sessions.messageCount} + 1`,
                toolsUsed: mergedTools,
                wallet: wallet ?? existing[0].wallet,
                updatedAt: new Date(),
              })
              .where(eq(sessions.id, sessionId));
          } else {
            return db!.insert(sessions).values({
              id: sessionId,
              wallet: wallet ?? null,
              messageCount: 1,
              toolsUsed: toolNames,
            });
          }
        })
        .catch((err) => console.error('Session tracking error:', err));
    }

    // Convert UI messages to model messages (async function!)
    const modelMessages = await convertToModelMessages(messages);
    console.log('Converted messages:', modelMessages?.length);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt + walletInfo,
      messages: modelMessages,
      tools: tidalTools,
      stopWhen: stepCountIs(5), // Allow AI to continue after tool calls (up to 5 steps)
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
