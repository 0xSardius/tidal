import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { yieldActions } from '@/lib/db/schema';

const createSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  recommendedProtocol: z.string().optional(),
  recommendedApy: z.string().optional(),
  recommendedToken: z.string().optional(),
  userAction: z.enum(['approved', 'rejected']),
  actualProtocol: z.string().optional(),
  txId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    if (!db) {
      return NextResponse.json({ success: true, note: 'no database configured' });
    }

    const body = await req.json();
    const parsed = createSchema.parse(body);

    await db.insert(yieldActions).values({
      wallet: parsed.wallet.toLowerCase(),
      recommendedProtocol: parsed.recommendedProtocol ?? null,
      recommendedApy: parsed.recommendedApy ?? null,
      recommendedToken: parsed.recommendedToken ?? null,
      userAction: parsed.userAction,
      actualProtocol: parsed.actualProtocol ?? null,
      txId: parsed.txId ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Yield-actions API error:', error);
    const message = error instanceof z.ZodError
      ? error.message
      : 'Failed to log yield action';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
