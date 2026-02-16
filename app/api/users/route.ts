import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

const upsertSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  riskDepth: z.enum(['shallows', 'mid-depth', 'deep-water']),
});

export async function POST(req: Request) {
  try {
    if (!db) {
      return NextResponse.json({ success: true, note: 'no database configured' });
    }

    const body = await req.json();
    const parsed = upsertSchema.parse(body);

    await db
      .insert(users)
      .values({
        wallet: parsed.wallet.toLowerCase(),
        riskDepth: parsed.riskDepth,
      })
      .onConflictDoUpdate({
        target: users.wallet,
        set: {
          riskDepth: parsed.riskDepth,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Users API error:', error);
    const message = error instanceof z.ZodError
      ? error.message
      : 'Failed to upsert user';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
