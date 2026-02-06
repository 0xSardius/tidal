import { formatUnits, parseUnits, type Address } from 'viem';
import { type VaultEntry } from './vault-registry';

/**
 * Generic ERC-4626 Vault Adapter
 *
 * Works with ANY vault that implements the ERC-4626 standard.
 * One implementation, unlimited vaults.
 */

// Minimal ERC-4626 ABI
export const ERC4626_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'redeem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertToAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'asset',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

// ERC-20 ABI for approvals
const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface VaultExecutionStatus {
  status: 'approving' | 'depositing' | 'withdrawing' | 'completed' | 'failed';
  message: string;
  txHash?: string;
}

/**
 * Execute a deposit into any ERC-4626 vault
 */
export async function executeVaultDeposit(params: {
  vault: VaultEntry;
  amount: string;
  userAddress: Address;
  walletClient: {
    writeContract: (config: {
      address: Address;
      abi: readonly object[];
      functionName: string;
      args: readonly unknown[];
    }) => Promise<`0x${string}`>;
  };
  publicClient: {
    waitForTransactionReceipt: (config: { hash: `0x${string}` }) => Promise<{ status: string }>;
    readContract: (config: {
      address: Address;
      abi: readonly object[];
      functionName: string;
      args: readonly unknown[];
    }) => Promise<bigint>;
  };
  onUpdate?: (status: VaultExecutionStatus) => void;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const { vault, amount, userAddress, walletClient, publicClient, onUpdate } = params;

  try {
    const amountWei = parseUnits(amount, vault.underlyingDecimals);

    // Step 1: Check allowance
    onUpdate?.({ status: 'approving', message: 'Checking allowance...' });

    const allowance = await publicClient.readContract({
      address: vault.underlyingAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, vault.address],
    });

    // Step 2: Approve if needed
    if (allowance < amountWei) {
      onUpdate?.({ status: 'approving', message: `Approve ${vault.underlyingToken} spending in wallet...` });

      const approveHash = await walletClient.writeContract({
        address: vault.underlyingAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [vault.address, amountWei],
      });

      onUpdate?.({ status: 'approving', message: 'Waiting for approval...', txHash: approveHash });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // Step 3: Deposit
    onUpdate?.({ status: 'depositing', message: `Confirm deposit to ${vault.name} in wallet...` });

    const depositHash = await walletClient.writeContract({
      address: vault.address,
      abi: ERC4626_ABI,
      functionName: 'deposit',
      args: [amountWei, userAddress],
    });

    onUpdate?.({ status: 'depositing', message: 'Waiting for confirmation...', txHash: depositHash });
    await publicClient.waitForTransactionReceipt({ hash: depositHash });

    onUpdate?.({ status: 'completed', message: 'Deposit completed!', txHash: depositHash });
    return { success: true, txHash: depositHash };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Deposit failed';
    onUpdate?.({ status: 'failed', message: errorMsg });
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute a withdrawal from any ERC-4626 vault
 */
export async function executeVaultWithdraw(params: {
  vault: VaultEntry;
  amount: string; // 'max' for full withdrawal
  userAddress: Address;
  walletClient: {
    writeContract: (config: {
      address: Address;
      abi: readonly object[];
      functionName: string;
      args: readonly unknown[];
    }) => Promise<`0x${string}`>;
  };
  publicClient: {
    waitForTransactionReceipt: (config: { hash: `0x${string}` }) => Promise<{ status: string }>;
    readContract: (config: {
      address: Address;
      abi: readonly object[];
      functionName: string;
      args: readonly unknown[];
    }) => Promise<bigint>;
  };
  onUpdate?: (status: VaultExecutionStatus) => void;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const { vault, amount, userAddress, walletClient, publicClient, onUpdate } = params;

  try {
    // Get user's shares
    const shares = await publicClient.readContract({
      address: vault.address,
      abi: ERC4626_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    let redeemShares = shares;
    if (amount !== 'max') {
      // Convert desired asset amount to approximate shares
      // For a more precise conversion we'd use convertToShares, but redeeming
      // all shares for 'max' or using the full balance is simpler
      const totalAssets = await publicClient.readContract({
        address: vault.address,
        abi: ERC4626_ABI,
        functionName: 'convertToAssets',
        args: [shares],
      });
      const amountWei = parseUnits(amount, vault.underlyingDecimals);
      // Proportional shares: shares * (amount / totalAssets)
      redeemShares = (shares * amountWei) / (totalAssets > 0n ? totalAssets : 1n);
    }

    if (redeemShares === 0n) {
      return { success: false, error: 'No position to withdraw' };
    }

    onUpdate?.({ status: 'withdrawing', message: `Confirm withdrawal from ${vault.name} in wallet...` });

    const redeemHash = await walletClient.writeContract({
      address: vault.address,
      abi: ERC4626_ABI,
      functionName: 'redeem',
      args: [redeemShares, userAddress, userAddress],
    });

    onUpdate?.({ status: 'withdrawing', message: 'Waiting for confirmation...', txHash: redeemHash });
    await publicClient.waitForTransactionReceipt({ hash: redeemHash });

    onUpdate?.({ status: 'completed', message: 'Withdrawal completed!', txHash: redeemHash });
    return { success: true, txHash: redeemHash };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Withdrawal failed';
    onUpdate?.({ status: 'failed', message: errorMsg });
    return { success: false, error: errorMsg };
  }
}

/**
 * Read a user's position in a vault
 */
export async function getVaultPosition(params: {
  vault: VaultEntry;
  userAddress: Address;
  publicClient: {
    readContract: (config: {
      address: Address;
      abi: readonly object[];
      functionName: string;
      args: readonly unknown[];
    }) => Promise<bigint>;
  };
}): Promise<{
  shares: bigint;
  assets: bigint;
  assetsFormatted: string;
  token: string;
  vaultName: string;
} | null> {
  const { vault, userAddress, publicClient } = params;

  try {
    const shares = await publicClient.readContract({
      address: vault.address,
      abi: ERC4626_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    if (shares === 0n) return null;

    const assets = await publicClient.readContract({
      address: vault.address,
      abi: ERC4626_ABI,
      functionName: 'convertToAssets',
      args: [shares],
    });

    return {
      shares,
      assets,
      assetsFormatted: formatUnits(assets, vault.underlyingDecimals),
      token: vault.underlyingToken,
      vaultName: vault.name,
    };
  } catch {
    return null;
  }
}
