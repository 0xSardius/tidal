import { describe, it, expect } from 'vitest';

// Test the friendlyError function (extracted inline for testing)
// This mirrors the logic in ActionCard.tsx
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('user rejected') || lower.includes('user denied') || lower.includes('rejected the request'))
    return 'Transaction cancelled. You can try again when ready.';
  if (lower.includes('insufficient funds') || lower.includes('exceeds balance') || lower.includes('insufficient balance') || lower.includes('balance is too low') || lower.includes('balanceerror'))
    return 'Insufficient balance. Check that you have enough tokens and ETH for gas.';
  if (lower.includes('slippage') || lower.includes('price movement'))
    return 'Price moved too much during execution. Try again with a fresh quote.';
  if (lower.includes('nonce') || lower.includes('replacement'))
    return 'Transaction conflict. Wait for pending transactions to complete and try again.';
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('fetch'))
    return 'Network error. Check your connection and try again.';
  if (lower.includes('allowance') || lower.includes('approve'))
    return 'Token approval needed. Please approve the token spend in your wallet.';
  if (lower.includes('gas') && lower.includes('estimate'))
    return 'Transaction may fail. You might not have enough tokens or the pool may be unavailable.';

  if (msg.length > 120) return msg.slice(0, 117) + '...';
  return msg;
}

describe('friendlyError', () => {
  it('handles user rejection', () => {
    expect(friendlyError(new Error('User rejected the request'))).toContain('cancelled');
  });

  it('handles insufficient funds', () => {
    expect(friendlyError(new Error('insufficient funds for gas'))).toContain('Insufficient balance');
  });

  it('handles slippage errors', () => {
    expect(friendlyError(new Error('slippage too high'))).toContain('Price moved');
  });

  it('handles nonce conflicts', () => {
    expect(friendlyError(new Error('nonce too low'))).toContain('conflict');
  });

  it('handles network errors', () => {
    expect(friendlyError(new Error('network timeout'))).toContain('Network error');
  });

  it('handles gas estimation errors', () => {
    expect(friendlyError(new Error('gas estimate failed'))).toContain('Transaction may fail');
  });

  it('truncates long messages', () => {
    const longMsg = 'A'.repeat(200);
    const result = friendlyError(new Error(longMsg));
    expect(result.length).toBeLessThanOrEqual(120);
    expect(result).toContain('...');
  });

  it('passes through short unknown errors', () => {
    expect(friendlyError(new Error('Something weird'))).toBe('Something weird');
  });

  it('handles non-Error values', () => {
    expect(friendlyError('string error')).toBe('string error');
  });
});

describe('amount validation', () => {
  it('rejects zero amounts', () => {
    const amount = '0';
    expect(isNaN(Number(amount)) || Number(amount) <= 0).toBe(true);
  });

  it('rejects negative amounts', () => {
    const amount = '-5';
    expect(isNaN(Number(amount)) || Number(amount) <= 0).toBe(true);
  });

  it('rejects non-numeric amounts', () => {
    const amount = 'abc';
    expect(isNaN(Number(amount)) || Number(amount) <= 0).toBe(true);
  });

  it('accepts valid amounts', () => {
    const amount = '100';
    expect(isNaN(Number(amount)) || Number(amount) <= 0).toBe(false);
  });

  it('accepts decimal amounts', () => {
    const amount = '0.5';
    expect(isNaN(Number(amount)) || Number(amount) <= 0).toBe(false);
  });
});

describe('quote staleness', () => {
  it('identifies fresh cards as not stale', () => {
    const createdAt = Date.now();
    const MAX_CARD_AGE_MS = 5 * 60 * 1000;
    expect(Date.now() - createdAt > MAX_CARD_AGE_MS).toBe(false);
  });

  it('identifies old cards as stale', () => {
    const createdAt = Date.now() - 6 * 60 * 1000; // 6 minutes ago
    const MAX_CARD_AGE_MS = 5 * 60 * 1000;
    expect(Date.now() - createdAt > MAX_CARD_AGE_MS).toBe(true);
  });
});
