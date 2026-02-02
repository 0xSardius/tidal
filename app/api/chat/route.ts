import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: 'You are Tidal, a helpful DeFi assistant. Keep responses concise.',
      messages,
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
