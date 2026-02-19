import { describe, it, expect, vi } from 'vitest';
import {
  executeAaveSupply,
  executeAaveWithdraw,
  describeAaveAction,
  getAaveAddresses,
  TOKEN_DECIMALS,
} from '../aave';
import type { Address } from 'viem';

const userAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as Address;
const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`;

function mockWalletClient() {
  return { writeContract: vi.fn().mockResolvedValue(txHash) };
}

function mockPublicClient(overrides: { allowance?: bigint; balance?: bigint } = {}) {
  const { allowance = 0n, balance = 1_000_000_000n } = overrides;
  return {
    waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }),
    readContract: vi.fn().mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'allowance') return Promise.resolve(allowance);
      if (functionName === 'balanceOf') return Promise.resolve(balance);
      return Promise.resolve(0n);
    }),
  };
}

// --- describeAaveAction ---

describe('describeAaveAction', () => {
  it('describes supply with APY', () => {
    const desc = describeAaveAction('supply', 'USDC', '1000', 3.9);
    expect(desc).toContain('Supply');
    expect(desc).toContain('1000');
    expect(desc).toContain('USDC');
    expect(desc).toContain('3.90%');
    expect(desc).toContain('APY');
    expect(desc).toContain('withdrawn anytime');
  });

  it('describes supply without APY', () => {
    const desc = describeAaveAction('supply', 'WETH', '0.5');
    expect(desc).toContain('Supply');
    expect(desc).toContain('0.5');
    expect(desc).toContain('WETH');
    expect(desc).not.toContain('APY');
  });

  it('describes withdraw', () => {
    const desc = describeAaveAction('withdraw', 'USDC', '500');
    expect(desc).toContain('Withdraw');
    expect(desc).toContain('500');
    expect(desc).toContain('USDC');
    expect(desc).toContain('wallet');
  });
});

// --- getAaveAddresses ---

describe('getAaveAddresses', () => {
  it('returns addresses for Base mainnet', () => {
    const addresses = getAaveAddresses(8453);
    expect(addresses.pool).toMatch(/^0x/);
    expect(addresses.dataProvider).toMatch(/^0x/);
    expect(addresses.tokens.USDC).toMatch(/^0x/);
    expect(addresses.tokens.WETH).toMatch(/^0x/);
  });

  it('returns addresses for Base Sepolia', () => {
    const addresses = getAaveAddresses(84532);
    expect(addresses.pool).toMatch(/^0x/);
    expect(addresses.tokens.USDC).toMatch(/^0x/);
  });

  it('throws for unsupported chain', () => {
    expect(() => getAaveAddresses(999)).toThrow('AAVE not supported');
  });
});

// --- TOKEN_DECIMALS ---

describe('TOKEN_DECIMALS', () => {
  it('USDC has 6 decimals', () => {
    expect(TOKEN_DECIMALS.USDC).toBe(6);
  });

  it('DAI has 18 decimals', () => {
    expect(TOKEN_DECIMALS.DAI).toBe(18);
  });

  it('WETH has 18 decimals', () => {
    expect(TOKEN_DECIMALS.WETH).toBe(18);
  });
});

// --- executeAaveSupply ---

describe('executeAaveSupply', () => {
  it('succeeds with approval flow (zero allowance)', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ allowance: 0n });
    const onUpdate = vi.fn();

    const result = await executeAaveSupply({
      chainId: 8453,
      token: 'USDC',
      amount: '100',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(true);
    expect(result.txHash).toBe(txHash);
    // 2 calls: approve + supply
    expect(wallet.writeContract).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'approving' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'supplying' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
  });

  it('skips approval when allowance is sufficient', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ allowance: 1_000_000_000n }); // 1000 USDC
    const onUpdate = vi.fn();

    const result = await executeAaveSupply({
      chainId: 8453,
      token: 'USDC',
      amount: '100',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(true);
    // 1 call: supply only
    expect(wallet.writeContract).toHaveBeenCalledTimes(1);
  });

  it('handles "max" amount by reading balance', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ allowance: 0n, balance: 500_000_000n }); // 500 USDC
    const onUpdate = vi.fn();

    const result = await executeAaveSupply({
      chainId: 8453,
      token: 'USDC',
      amount: 'max',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(true);
    // readContract called for: balanceOf, allowance
    expect(pub.readContract).toHaveBeenCalled();
  });

  it('fails when max amount is zero balance', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ allowance: 0n, balance: 0n });

    const result = await executeAaveSupply({
      chainId: 8453,
      token: 'USDC',
      amount: 'max',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No USDC balance');
  });

  it('handles wallet rejection', async () => {
    const wallet = { writeContract: vi.fn().mockRejectedValue(new Error('User rejected')) };
    const pub = mockPublicClient({ allowance: 1_000_000_000n });
    const onUpdate = vi.fn();

    const result = await executeAaveSupply({
      chainId: 8453,
      token: 'USDC',
      amount: '100',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('User rejected');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });

  it('works for WETH token', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ allowance: 0n });

    const result = await executeAaveSupply({
      chainId: 8453,
      token: 'WETH',
      amount: '0.5',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
    });

    expect(result.success).toBe(true);
  });

  it('works without onUpdate callback', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ allowance: 1_000_000_000n });

    const result = await executeAaveSupply({
      chainId: 8453,
      token: 'USDC',
      amount: '50',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
    });

    expect(result.success).toBe(true);
  });
});

// --- executeAaveWithdraw ---

describe('executeAaveWithdraw', () => {
  it('withdraws a specific amount', async () => {
    const wallet = mockWalletClient();
    const pub = { waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }) };
    const onUpdate = vi.fn();

    const result = await executeAaveWithdraw({
      chainId: 8453,
      token: 'USDC',
      amount: '100',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(true);
    expect(result.txHash).toBe(txHash);
    expect(wallet.writeContract).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'withdrawing' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
  });

  it('withdraws max (uses MaxUint256)', async () => {
    const wallet = mockWalletClient();
    const pub = { waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }) };

    const result = await executeAaveWithdraw({
      chainId: 8453,
      token: 'USDC',
      amount: 'max',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
    });

    expect(result.success).toBe(true);
    // Verify the amount arg is MaxUint256
    const callArgs = wallet.writeContract.mock.calls[0][0];
    expect(callArgs.args[1]).toBe(
      BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    );
  });

  it('handles wallet rejection', async () => {
    const wallet = { writeContract: vi.fn().mockRejectedValue(new Error('User denied')) };
    const pub = { waitForTransactionReceipt: vi.fn() };
    const onUpdate = vi.fn();

    const result = await executeAaveWithdraw({
      chainId: 8453,
      token: 'USDC',
      amount: '100',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('User denied');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });

  it('works for WETH withdraw', async () => {
    const wallet = mockWalletClient();
    const pub = { waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }) };

    const result = await executeAaveWithdraw({
      chainId: 8453,
      token: 'WETH',
      amount: '1.5',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
    });

    expect(result.success).toBe(true);
  });
});
