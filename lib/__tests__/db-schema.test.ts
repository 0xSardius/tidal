import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// These mirror the Zod schemas used in the API routes.
// Testing them here validates input parsing without needing a live DB.

const walletRegex = /^0x[a-fA-F0-9]{40}$/;

const userSchema = z.object({
  wallet: z.string().regex(walletRegex),
  riskDepth: z.enum(['shallows', 'mid-depth', 'deep-water']),
});

const transactionCreateSchema = z.object({
  wallet: z.string().regex(walletRegex),
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

const sessionSchema = z.object({
  sessionId: z.string().uuid(),
  wallet: z.string().regex(walletRegex).optional(),
  messageCount: z.number().int().positive().optional(),
  toolsUsed: z.array(z.string()).optional(),
});

const yieldActionSchema = z.object({
  wallet: z.string().regex(walletRegex),
  recommendedProtocol: z.string().optional(),
  recommendedApy: z.string().optional(),
  recommendedToken: z.string().optional(),
  userAction: z.enum(['approved', 'rejected']),
  actualProtocol: z.string().optional(),
  txId: z.string().uuid().optional(),
});

describe('user schema validation', () => {
  it('accepts valid user data', () => {
    const result = userSchema.parse({
      wallet: '0x1234567890abcdef1234567890abcdef12345678',
      riskDepth: 'mid-depth',
    });
    expect(result.wallet).toBe('0x1234567890abcdef1234567890abcdef12345678');
    expect(result.riskDepth).toBe('mid-depth');
  });

  it('rejects invalid wallet address', () => {
    expect(() => userSchema.parse({ wallet: 'not-a-wallet', riskDepth: 'shallows' })).toThrow();
  });

  it('rejects short wallet address', () => {
    expect(() => userSchema.parse({ wallet: '0x1234', riskDepth: 'shallows' })).toThrow();
  });

  it('rejects invalid risk depth', () => {
    expect(() =>
      userSchema.parse({
        wallet: '0x1234567890abcdef1234567890abcdef12345678',
        riskDepth: 'extreme',
      })
    ).toThrow();
  });

  it('accepts all three risk depths', () => {
    const wallet = '0x1234567890abcdef1234567890abcdef12345678';
    expect(userSchema.parse({ wallet, riskDepth: 'shallows' }).riskDepth).toBe('shallows');
    expect(userSchema.parse({ wallet, riskDepth: 'mid-depth' }).riskDepth).toBe('mid-depth');
    expect(userSchema.parse({ wallet, riskDepth: 'deep-water' }).riskDepth).toBe('deep-water');
  });
});

describe('transaction schema validation', () => {
  const validWallet = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

  it('accepts minimal valid transaction', () => {
    const result = transactionCreateSchema.parse({
      wallet: validWallet,
      type: 'swap',
    });
    expect(result.wallet).toBe(validWallet);
    expect(result.type).toBe('swap');
    expect(result.chain).toBe('base');
    expect(result.status).toBe('pending');
  });

  it('accepts full transaction data', () => {
    const result = transactionCreateSchema.parse({
      wallet: validWallet,
      type: 'vault_deposit',
      protocol: 'Morpho Gauntlet',
      token: 'USDC',
      amount: '1000.50',
      txHash: '0xabc123',
      chain: 'base',
      status: 'success',
      metadata: { estimatedApy: 5.13, vaultSlug: 'morpho-gauntlet-usdc' },
    });
    expect(result.protocol).toBe('Morpho Gauntlet');
    expect(result.status).toBe('success');
    expect(result.metadata?.estimatedApy).toBe(5.13);
  });

  it('accepts all transaction types', () => {
    const types = ['swap', 'supply', 'withdraw', 'vault_deposit', 'vault_withdraw', 'swap_and_supply'] as const;
    for (const type of types) {
      const result = transactionCreateSchema.parse({ wallet: validWallet, type });
      expect(result.type).toBe(type);
    }
  });

  it('rejects invalid transaction type', () => {
    expect(() =>
      transactionCreateSchema.parse({ wallet: validWallet, type: 'invalid' })
    ).toThrow();
  });

  it('rejects invalid status', () => {
    expect(() =>
      transactionCreateSchema.parse({ wallet: validWallet, type: 'swap', status: 'unknown' })
    ).toThrow();
  });

  it('accepts failed transaction with error message', () => {
    const result = transactionCreateSchema.parse({
      wallet: validWallet,
      type: 'supply',
      status: 'failed',
      errorMessage: 'Insufficient balance',
    });
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toBe('Insufficient balance');
  });
});

describe('session schema validation', () => {
  it('accepts valid session', () => {
    const result = sessionSchema.parse({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      wallet: '0x1234567890abcdef1234567890abcdef12345678',
      messageCount: 1,
      toolsUsed: ['getQuote', 'prepareSupply'],
    });
    expect(result.sessionId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.toolsUsed).toHaveLength(2);
  });

  it('accepts session without wallet', () => {
    const result = sessionSchema.parse({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.wallet).toBeUndefined();
  });

  it('rejects invalid session ID (not UUID)', () => {
    expect(() =>
      sessionSchema.parse({ sessionId: 'not-a-uuid' })
    ).toThrow();
  });

  it('rejects non-positive message count', () => {
    expect(() =>
      sessionSchema.parse({
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        messageCount: 0,
      })
    ).toThrow();
  });
});

describe('yield action schema validation', () => {
  const validWallet = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

  it('accepts approved yield action', () => {
    const result = yieldActionSchema.parse({
      wallet: validWallet,
      recommendedProtocol: 'AAVE V3',
      recommendedApy: '3.9',
      recommendedToken: 'USDC',
      userAction: 'approved',
      actualProtocol: 'AAVE V3',
      txId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.userAction).toBe('approved');
    expect(result.txId).toBeDefined();
  });

  it('accepts rejected yield action (minimal)', () => {
    const result = yieldActionSchema.parse({
      wallet: validWallet,
      userAction: 'rejected',
    });
    expect(result.userAction).toBe('rejected');
    expect(result.txId).toBeUndefined();
  });

  it('rejects invalid user action', () => {
    expect(() =>
      yieldActionSchema.parse({ wallet: validWallet, userAction: 'ignored' })
    ).toThrow();
  });

  it('rejects invalid txId (not UUID)', () => {
    expect(() =>
      yieldActionSchema.parse({
        wallet: validWallet,
        userAction: 'approved',
        txId: 'not-a-uuid',
      })
    ).toThrow();
  });
});
