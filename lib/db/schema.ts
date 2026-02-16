import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  jsonb,
  integer,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums
export const riskDepthEnum = pgEnum('risk_depth', [
  'shallows',
  'mid-depth',
  'deep-water',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'swap',
  'supply',
  'withdraw',
  'vault_deposit',
  'vault_withdraw',
  'swap_and_supply',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'success',
  'failed',
]);

export const userActionEnum = pgEnum('user_action', [
  'approved',
  'rejected',
]);

// Tables
export const users = pgTable('users', {
  wallet: text('wallet').primaryKey(),
  riskDepth: riskDepthEnum('risk_depth').notNull().default('shallows'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wallet: text('wallet').notNull(),
    type: transactionTypeEnum('type').notNull(),
    protocol: text('protocol'),
    token: text('token'),
    amount: numeric('amount'),
    txHash: text('tx_hash'),
    chain: text('chain').notNull().default('base'),
    status: transactionStatusEnum('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('transactions_wallet_created_idx').on(table.wallet, table.createdAt),
  ]
);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  wallet: text('wallet'),
  messageCount: integer('message_count').notNull().default(0),
  toolsUsed: jsonb('tools_used').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const yieldActions = pgTable(
  'yield_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wallet: text('wallet').notNull(),
    recommendedProtocol: text('recommended_protocol'),
    recommendedApy: numeric('recommended_apy'),
    recommendedToken: text('recommended_token'),
    userAction: userActionEnum('user_action').notNull(),
    actualProtocol: text('actual_protocol'),
    txId: uuid('tx_id').references(() => transactions.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('yield_actions_wallet_idx').on(table.wallet),
  ]
);
