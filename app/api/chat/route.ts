import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createMCPClient } from '@ai-sdk/mcp';
import { tidalTools } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { type RiskDepth } from '@/lib/constants';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const maxDuration = 60;

export async function POST(req: Request) {
  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

  try {
    const body = await req.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    const { messages, data } = body;
    const context = data?.context;

    console.log('Messages count:', messages?.length);
    console.log('First message:', messages?.[0]);

    // Build context from request
    const userContext = {
      riskDepth: (context?.riskDepth || 'shallows') as RiskDepth,
      walletConnected: context?.walletConnected ?? false,
      positions: context?.positions || [],
      autonomyMode: (context?.autonomyMode || 'supervised') as 'supervised' | 'autopilot',
    };

    const marketContext = {
      rates: context?.rates,
      gasPrice: context?.gasPrice,
    };

    const systemPrompt = buildSystemPrompt(userContext, marketContext);

    // Include wallet context in system prompt for tools
    const chainName = context?.chainName || 'Base';
    const chainId = context?.chainId || 8453;
    const walletInfo = context?.walletAddress
      ? `\n\nUser wallet: ${context.walletAddress}\nChain: ${chainName} (chainId: ${chainId})`
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

    // Try to connect Li.Fi MCP server for additional tools (5s timeout to avoid eating function budget)
    let allTools = { ...tidalTools } as Record<string, unknown>;
    let mcpAvailable = false;
    try {
      const mcpPromise = createMCPClient({
        transport: { type: 'sse', url: 'https://mcp.li.quest/sse' },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('MCP connection timed out after 5s')), 5000)
      );
      mcpClient = await Promise.race([mcpPromise, timeoutPromise]);
      const mcpTools = await mcpClient.tools();
      allTools = { ...tidalTools, ...mcpTools };
      mcpAvailable = true;
      console.log('Li.Fi MCP tools loaded:', Object.keys(mcpTools).length);
    } catch (err) {
      console.warn('Li.Fi MCP server unavailable, using tidal tools only:', err instanceof Error ? err.message : err);
    }

    // Tell the agent about MCP tool availability
    const mcpNote = mcpAvailable
      ? '\n\nLi.Fi MCP tools are available — you have access to additional Li.Fi-specific tools beyond the built-in Tidal tools.'
      : '\n\nLi.Fi MCP tools are currently unavailable. Use the built-in Tidal tools (getQuote, prepareSwap, prepareBridge, prepareCrossChainYield) for all swap and bridge operations. Do not mention MCP tools to the user.';

    // Convert UI messages to model messages (async function!)
    const modelMessages = await convertToModelMessages(messages);
    console.log('Converted messages:', modelMessages?.length);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt + walletInfo + mcpNote,
      messages: modelMessages,
      tools: allTools as typeof tidalTools,
      stopWhen: stepCountIs(5),
      onFinish: async () => {
        // Clean up MCP client when stream finishes
        if (mcpClient) {
          try { await mcpClient.close(); } catch { /* ignore */ }
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    // Clean up MCP client on error
    if (mcpClient) {
      try { await mcpClient.close(); } catch { /* ignore */ }
    }
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
