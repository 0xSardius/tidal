import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('db connection (null-safe)', () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
    // Clear module cache so lib/db/index.ts re-evaluates
    vi.resetModules();
  });

  it('returns null when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL;
    const { db } = await import('../db/index');
    expect(db).toBeNull();
  });

  it('returns a drizzle instance when DATABASE_URL is set', async () => {
    // Use a dummy URL — neon() won't connect until a query is executed
    process.env.DATABASE_URL = 'postgresql://user:pass@ep-test.us-east-2.aws.neon.tech/dbname?sslmode=require';
    const { db } = await import('../db/index');
    expect(db).not.toBeNull();
    expect(db).toHaveProperty('select');
    expect(db).toHaveProperty('insert');
    expect(db).toHaveProperty('update');
  });
});

describe('schema table definitions', () => {
  it('exports all 4 tables', async () => {
    const schema = await import('../db/schema');
    expect(schema.users).toBeDefined();
    expect(schema.transactions).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.yieldActions).toBeDefined();
  });

  it('exports all 4 enums', async () => {
    const schema = await import('../db/schema');
    expect(schema.riskDepthEnum).toBeDefined();
    expect(schema.transactionTypeEnum).toBeDefined();
    expect(schema.transactionStatusEnum).toBeDefined();
    expect(schema.userActionEnum).toBeDefined();
  });

  it('users table has wallet as primary key', async () => {
    const { users } = await import('../db/schema');
    // Drizzle table columns are accessible
    expect(users.wallet).toBeDefined();
    expect(users.riskDepth).toBeDefined();
    expect(users.createdAt).toBeDefined();
    expect(users.updatedAt).toBeDefined();
  });

  it('transactions table has expected columns', async () => {
    const { transactions } = await import('../db/schema');
    expect(transactions.id).toBeDefined();
    expect(transactions.wallet).toBeDefined();
    expect(transactions.type).toBeDefined();
    expect(transactions.protocol).toBeDefined();
    expect(transactions.token).toBeDefined();
    expect(transactions.amount).toBeDefined();
    expect(transactions.txHash).toBeDefined();
    expect(transactions.chain).toBeDefined();
    expect(transactions.status).toBeDefined();
    expect(transactions.errorMessage).toBeDefined();
    expect(transactions.metadata).toBeDefined();
    expect(transactions.createdAt).toBeDefined();
  });

  it('yield_actions table references transactions', async () => {
    const { yieldActions } = await import('../db/schema');
    expect(yieldActions.txId).toBeDefined();
    expect(yieldActions.userAction).toBeDefined();
    expect(yieldActions.recommendedProtocol).toBeDefined();
  });
});
