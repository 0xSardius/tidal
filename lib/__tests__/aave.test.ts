import { describe, it, expect } from 'vitest';
import {
  rayToApy,
  parseSupplyAmount,
  formatSupplyAmount,
  getAaveAddresses,
  prepareSupplyTx,
  prepareWithdrawTx,
  TOKEN_DECIMALS,
} from '../aave';
import { base, baseSepolia } from 'viem/chains';

describe('rayToApy', () => {
  it('converts RAY liquidity rate to APY percentage', () => {
    // 3.9% APY in RAY = 3.9e25
    const rate = BigInt('39000000000000000000000000');
    const apy = rayToApy(rate);
    expect(apy).toBeCloseTo(3.9, 0);
  });

  it('returns 0 for zero rate', () => {
    expect(rayToApy(0n)).toBe(0);
  });
});

describe('parseSupplyAmount / formatSupplyAmount', () => {
  it('parses USDC amount (6 decimals)', () => {
    const result = parseSupplyAmount('100', 6);
    expect(result).toBe(100_000_000n);
  });

  it('parses WETH amount (18 decimals)', () => {
    const result = parseSupplyAmount('1', 18);
    expect(result).toBe(1_000_000_000_000_000_000n);
  });

  it('formats USDC amount back', () => {
    const result = formatSupplyAmount(100_000_000n, 6);
    expect(result).toBe('100');
  });

  it('handles decimal amounts', () => {
    const result = parseSupplyAmount('0.5', 6);
    expect(result).toBe(500_000n);
  });
});

describe('getAaveAddresses', () => {
  it('returns addresses for Base mainnet', () => {
    const addresses = getAaveAddresses(base.id);
    expect(addresses.pool).toBeDefined();
    expect(addresses.dataProvider).toBeDefined();
    expect(addresses.tokens.USDC).toBeDefined();
    expect(addresses.tokens.WETH).toBeDefined();
  });

  it('returns addresses for Base Sepolia', () => {
    const addresses = getAaveAddresses(baseSepolia.id);
    expect(addresses.pool).toBeDefined();
  });

  it('throws for unsupported chain', () => {
    expect(() => getAaveAddresses(999)).toThrow('AAVE not supported');
  });
});

describe('prepareSupplyTx', () => {
  it('generates valid approve + supply tx data', () => {
    const result = prepareSupplyTx({
      chainId: base.id,
      token: 'USDC',
      amount: 100_000_000n, // 100 USDC
      userAddress: '0x1234567890123456789012345678901234567890',
    });

    expect(result.approveTx.functionName).toBe('approve');
    expect(result.supplyTx.functionName).toBe('supply');
    expect(result.supplyTx.args[1]).toBe(100_000_000n);
    // referralCode should be 0
    expect(result.supplyTx.args[3]).toBe(0);
  });

  it('throws for unsupported token', () => {
    expect(() =>
      prepareSupplyTx({
        chainId: base.id,
        token: 'INVALID' as any,
        amount: 100n,
        userAddress: '0x1234567890123456789012345678901234567890',
      })
    ).toThrow('not supported');
  });
});

describe('prepareWithdrawTx', () => {
  it('generates valid withdraw tx data', () => {
    const result = prepareWithdrawTx({
      chainId: base.id,
      token: 'USDC',
      amount: 100_000_000n,
      userAddress: '0x1234567890123456789012345678901234567890',
    });

    expect(result.withdrawTx.functionName).toBe('withdraw');
    expect(result.withdrawTx.args[1]).toBe(100_000_000n);
  });
});

describe('TOKEN_DECIMALS', () => {
  it('has correct decimals for USDC', () => {
    expect(TOKEN_DECIMALS.USDC).toBe(6);
  });

  it('has correct decimals for WETH', () => {
    expect(TOKEN_DECIMALS.WETH).toBe(18);
  });
});
