import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';

const upsertSchema = z.object({
  sessionId: z.string().uuid(),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  messageCount: z.number().int().positive().optional(),
  toolsUsed: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    if (!db) {
      return NextResponse.json({ success: true, note: 'no database configured' });
    }

    const body = await req.json();
    const parsed = upsertSchema.parse(body);

    // Try to get existing session
    const existing = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, parsed.sessionId))
      .limit(1);

    if (existing.length > 0) {
      // Merge tools used
      const currentTools = (existing[0].toolsUsed ?? []) as string[];
      const newTools = parsed.toolsUsed ?? [];
      const mergedTools = [...new Set([...currentTools, ...newTools])];

      await db
        .update(sessions)
        .set({
          messageCount: parsed.messageCount
            ? sql`${sessions.messageCount} + ${parsed.messageCount}`
            : sessions.messageCount,
          toolsUsed: mergedTools,
          wallet: parsed.wallet?.toLowerCase() ?? existing[0].wallet,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, parsed.sessionId));
    } else {
      await db.insert(sessions).values({
        id: parsed.sessionId,
        wallet: parsed.wallet?.toLowerCase() ?? null,
        messageCount: parsed.messageCount ?? 1,
        toolsUsed: parsed.toolsUsed ?? [],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sessions API error:', error);
    const message = error instanceof z.ZodError
      ? error.message
      : 'Failed to update session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
