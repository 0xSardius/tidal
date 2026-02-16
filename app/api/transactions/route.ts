import { NextResponse } from 'next/server';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';

const createSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  type: z.enum(['swap', 'supply', 'withdraw', 'vault_deposit', 'vault_withdraw', 'swap_and_supply']),
  protocol: z.string().optional(),
  token: z.string().optional(),
  amount: z.string().optional(),
  txHash: z.string().optional(),
  chain: z.string().default('base'),
  status: z.enum(['pending', 'success', 'failed']).default('pending'),
  errorMessage: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  try {
    if (!db) {
      return NextResponse.json({ success: true, note: 'no database configured' });
    }

    const body = await req.json();
    const parsed = createSchema.parse(body);

    const [row] = await db
      .insert(transactions)
      .values({
        wallet: parsed.wallet.toLowerCase(),
        type: parsed.type,
        protocol: parsed.protocol ?? null,
        token: parsed.token ?? null,
        amount: parsed.amount ?? null,
        txHash: parsed.txHash ?? null,
        chain: parsed.chain,
        status: parsed.status,
        errorMessage: parsed.errorMessage ?? null,
        metadata: parsed.metadata ?? null,
      })
      .returning({ id: transactions.id });

    return NextResponse.json({ success: true, id: row.id });
  } catch (error) {
    console.error('Transactions POST error:', error);
    const message = error instanceof z.ZodError
      ? error.message
      : 'Failed to log transaction';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    if (!db) {
      return NextResponse.json({ success: true, transactions: [] });
    }

    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!wallet) {
      return NextResponse.json({ error: 'wallet query param required' }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.wallet, wallet.toLowerCase()))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ success: true, transactions: rows });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
