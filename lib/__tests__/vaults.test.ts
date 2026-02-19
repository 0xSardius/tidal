import { describe, it, expect, vi } from 'vitest';
import { executeVaultDeposit, executeVaultWithdraw, getVaultPosition } from '../vaults';
import type { VaultEntry } from '../vault-registry';
import type { Address } from 'viem';

// Mock vault entry
const mockVault: VaultEntry = {
  name: 'Test USDC Vault',
  protocol: 'morpho-v1',
  curator: 'Test Curator',
  address: '0x1111111111111111111111111111111111111111' as Address,
  underlyingToken: 'USDC',
  underlyingAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  underlyingDecimals: 6,
  chainId: 8453,
  riskLevel: 1,
  apyEstimate: 4.0,
  description: 'Test vault',
};

const mockWethVault: VaultEntry = {
  ...mockVault,
  name: 'Test WETH Vault',
  underlyingToken: 'WETH',
  underlyingAddress: '0x4200000000000000000000000000000000000006' as Address,
  underlyingDecimals: 18,
  address: '0x2222222222222222222222222222222222222222' as Address,
};

const userAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as Address;
const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`;

function mockWalletClient() {
  return { writeContract: vi.fn().mockResolvedValue(txHash) };
}

function mockPublicClient(overrides: { allowance?: bigint; shares?: bigint; assets?: bigint } = {}) {
  const { allowance = 0n, shares = 0n, assets = 0n } = overrides;
  return {
    waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }),
    readContract: vi.fn().mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'allowance') return Promise.resolve(allowance);
      if (functionName === 'balanceOf') return Promise.resolve(shares);
      if (functionName === 'convertToAssets') return Promise.resolve(assets);
      return Promise.resolve(0n);
    }),
  };
}

// --- executeVaultDeposit ---

describe('executeVaultDeposit', () => {
  it('succeeds with approval needed (zero allowance)', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ allowance: 0n });
    const onUpdate = vi.fn();

    const result = await executeVaultDeposit({
      vault: mockVault,
      amount: '100',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(true);
    expect(result.txHash).toBe(txHash);
    // Should call writeContract twice: approve + deposit
    expect(wallet.writeContract).toHaveBeenCalledTimes(2);
    // Should have called onUpdate with approval and deposit statuses
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'approving' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'depositing' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
  });

  it('skips approval when allowance is sufficient', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ allowance: 1_000_000_000n }); // 1000 USDC
    const onUpdate = vi.fn();

    const result = await executeVaultDeposit({
      vault: mockVault,
      amount: '100',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(true);
    // Should call writeContract once: only deposit (no approve)
    expect(wallet.writeContract).toHaveBeenCalledTimes(1);
  });

  it('handles wallet rejection error', async () => {
    const wallet = { writeContract: vi.fn().mockRejectedValue(new Error('User rejected')) };
    const pub = mockPublicClient({ allowance: 1_000_000_000n });
    const onUpdate = vi.fn();

    const result = await executeVaultDeposit({
      vault: mockVault,
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

  it('handles 18-decimal tokens (WETH)', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ allowance: 0n });

    const result = await executeVaultDeposit({
      vault: mockWethVault,
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

    const result = await executeVaultDeposit({
      vault: mockVault,
      amount: '50',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
    });

    expect(result.success).toBe(true);
  });
});

// --- executeVaultWithdraw ---

describe('executeVaultWithdraw', () => {
  it('withdraws max (all shares)', async () => {
    const wallet = mockWalletClient();
    const shares = 100_000_000n; // 100 shares
    const pub = mockPublicClient({ shares });
    const onUpdate = vi.fn();

    const result = await executeVaultWithdraw({
      vault: mockVault,
      amount: 'max',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(true);
    expect(result.txHash).toBe(txHash);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'withdrawing' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
  });

  it('withdraws partial amount', async () => {
    const wallet = mockWalletClient();
    const shares = 200_000_000n;
    const assets = 200_000_000n; // 1:1 share-to-asset ratio
    const pub = mockPublicClient({ shares, assets });

    const result = await executeVaultWithdraw({
      vault: mockVault,
      amount: '100',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
    });

    expect(result.success).toBe(true);
  });

  it('fails when no position exists', async () => {
    const wallet = mockWalletClient();
    const pub = mockPublicClient({ shares: 0n });

    const result = await executeVaultWithdraw({
      vault: mockVault,
      amount: 'max',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No position');
  });

  it('handles wallet rejection error', async () => {
    const wallet = { writeContract: vi.fn().mockRejectedValue(new Error('User denied')) };
    const pub = mockPublicClient({ shares: 100_000_000n });
    const onUpdate = vi.fn();

    const result = await executeVaultWithdraw({
      vault: mockVault,
      amount: 'max',
      userAddress,
      walletClient: wallet,
      publicClient: pub,
      onUpdate,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('User denied');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });
});

// --- getVaultPosition ---

describe('getVaultPosition', () => {
  it('returns position when user has shares', async () => {
    const shares = 100_000_000n;
    const assets = 105_000_000n; // slightly more assets than shares (earned yield)
    const pub = mockPublicClient({ shares, assets });

    const position = await getVaultPosition({
      vault: mockVault,
      userAddress,
      publicClient: pub,
    });

    expect(position).not.toBeNull();
    expect(position!.shares).toBe(shares);
    expect(position!.assets).toBe(assets);
    expect(position!.token).toBe('USDC');
    expect(position!.vaultName).toBe('Test USDC Vault');
    expect(position!.assetsFormatted).toBe('105'); // 105_000_000 / 1e6
  });

  it('returns null when user has no shares', async () => {
    const pub = mockPublicClient({ shares: 0n });

    const position = await getVaultPosition({
      vault: mockVault,
      userAddress,
      publicClient: pub,
    });

    expect(position).toBeNull();
  });

  it('returns null on RPC error', async () => {
    const pub = {
      readContract: vi.fn().mockRejectedValue(new Error('RPC timeout')),
    };

    const position = await getVaultPosition({
      vault: mockVault,
      userAddress,
      publicClient: pub,
    });

    expect(position).toBeNull();
  });

  it('formats 18-decimal tokens correctly', async () => {
    const shares = 500_000_000_000_000_000n; // 0.5 shares
    const assets = 510_000_000_000_000_000n; // 0.51 assets
    const pub = mockPublicClient({ shares, assets });

    const position = await getVaultPosition({
      vault: mockWethVault,
      userAddress,
      publicClient: pub,
    });

    expect(position).not.toBeNull();
    expect(position!.token).toBe('WETH');
    expect(position!.assetsFormatted).toBe('0.51');
  });
});
