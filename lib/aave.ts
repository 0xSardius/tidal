import { formatUnits, parseUnits, type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// AAVE V3 Pool ABI (minimal for supply/withdraw)
export const AAVE_POOL_ABI = [
  {
    name: 'supply',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getUserAccountData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
    ],
  },
] as const;

// AAVE Pool Data Provider ABI (for APY data)
export const AAVE_DATA_PROVIDER_ABI = [
  {
    name: 'getReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [
      { name: 'unbacked', type: 'uint256' },
      { name: 'accruedToTreasuryScaled', type: 'uint256' },
      { name: 'totalAToken', type: 'uint256' },
      { name: 'totalStableDebt', type: 'uint256' },
      { name: 'totalVariableDebt', type: 'uint256' },
      { name: 'liquidityRate', type: 'uint256' },
      { name: 'variableBorrowRate', type: 'uint256' },
      { name: 'stableBorrowRate', type: 'uint256' },
      { name: 'averageStableBorrowRate', type: 'uint256' },
      { name: 'liquidityIndex', type: 'uint256' },
      { name: 'variableBorrowIndex', type: 'uint256' },
      { name: 'lastUpdateTimestamp', type: 'uint40' },
    ],
  },
  {
    name: 'getUserReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'user', type: 'address' },
    ],
    outputs: [
      { name: 'currentATokenBalance', type: 'uint256' },
      { name: 'currentStableDebt', type: 'uint256' },
      { name: 'currentVariableDebt', type: 'uint256' },
      { name: 'principalStableDebt', type: 'uint256' },
      { name: 'scaledVariableDebt', type: 'uint256' },
      { name: 'stableBorrowRate', type: 'uint256' },
      { name: 'liquidityRate', type: 'uint256' },
      { name: 'stableRateLastUpdated', type: 'uint40' },
      { name: 'usageAsCollateralEnabled', type: 'bool' },
    ],
  },
] as const;

// ERC20 ABI for approvals
export const ERC20_ABI = [
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
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Contract addresses per chain
export const AAVE_ADDRESSES = {
  [baseSepolia.id]: {
    pool: '0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b' as Address,
    dataProvider: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac' as Address,
    tokens: {
      USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
      WETH: '0x4200000000000000000000000000000000000006' as Address,
    },
  },
  [base.id]: {
    pool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as Address,
    dataProvider: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac' as Address,
    tokens: {
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
      DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as Address,
      WETH: '0x4200000000000000000000000000000000000006' as Address,
    },
  },
} as const;

export type AaveChainId = keyof typeof AAVE_ADDRESSES;
export type AaveToken = 'USDC' | 'DAI' | 'WETH';

/**
 * Get AAVE addresses for a chain
 */
export function getAaveAddresses(chainId: number) {
  const addresses = AAVE_ADDRESSES[chainId as AaveChainId];
  if (!addresses) {
    throw new Error(`AAVE not supported on chain ${chainId}`);
  }
  return addresses;
}

/**
 * Convert liquidity rate from RAY (27 decimals) to APY percentage
 * AAVE uses RAY format: 1e27 = 100%
 */
export function rayToApy(liquidityRate: bigint): number {
  // liquidityRate is in RAY (1e27)
  // APY = (1 + rate/secondsPerYear)^secondsPerYear - 1
  // Simplified: APY ≈ rate * 100 / 1e27
  const ratePercent = Number(liquidityRate) / 1e25; // Convert to percentage
  return ratePercent;
}

/**
 * Format supply amount for display
 */
export function formatSupplyAmount(
  amount: bigint,
  decimals: number = 6
): string {
  return formatUnits(amount, decimals);
}

/**
 * Parse supply amount from user input
 */
export function parseSupplyAmount(
  amount: string,
  decimals: number = 6
): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Token decimals lookup
 */
export const TOKEN_DECIMALS: Record<AaveToken, number> = {
  USDC: 6,
  DAI: 18,
  WETH: 18,
};

/**
 * User position in AAVE
 */
export interface AavePosition {
  token: AaveToken;
  suppliedAmount: bigint;
  suppliedFormatted: string;
  currentApy: number;
  earnedInterest?: bigint;
}

/**
 * AAVE reserve data
 */
export interface AaveReserveData {
  token: AaveToken;
  liquidityRate: bigint;
  apy: number;
  totalSupplied: bigint;
}

/**
 * Prepare supply transaction data
 */
export function prepareSupplyTx(params: {
  chainId: number;
  token: AaveToken;
  amount: bigint;
  userAddress: Address;
}) {
  const addresses = getAaveAddresses(params.chainId);
  const tokenAddress = (addresses.tokens as Record<string, Address>)[params.token];

  if (!tokenAddress) {
    throw new Error(`Token ${params.token} not supported on chain ${params.chainId}`);
  }

  return {
    poolAddress: addresses.pool,
    tokenAddress,
    // Approval tx
    approveTx: {
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve' as const,
      args: [addresses.pool, params.amount] as const,
    },
    // Supply tx
    supplyTx: {
      address: addresses.pool,
      abi: AAVE_POOL_ABI,
      functionName: 'supply' as const,
      args: [tokenAddress, params.amount, params.userAddress, 0] as const,
    },
  };
}

/**
 * Prepare withdraw transaction data
 */
export function prepareWithdrawTx(params: {
  chainId: number;
  token: AaveToken;
  amount: bigint; // Use MaxUint256 for full withdrawal
  userAddress: Address;
}) {
  const addresses = getAaveAddresses(params.chainId);
  const tokenAddress = (addresses.tokens as Record<string, Address>)[params.token];

  if (!tokenAddress) {
    throw new Error(`Token ${params.token} not supported on chain ${params.chainId}`);
  }

  return {
    poolAddress: addresses.pool,
    tokenAddress,
    withdrawTx: {
      address: addresses.pool,
      abi: AAVE_POOL_ABI,
      functionName: 'withdraw' as const,
      args: [tokenAddress, params.amount, params.userAddress] as const,
    },
  };
}

/**
 * Describe AAVE action for AI agent
 */
export function describeAaveAction(
  action: 'supply' | 'withdraw',
  token: AaveToken,
  amount: string,
  apy?: number
): string {
  if (action === 'supply') {
    const apyStr = apy ? ` earning ${apy.toFixed(2)}% APY` : '';
    return `Supply ${amount} ${token} to AAVE${apyStr}. Your funds remain liquid and can be withdrawn anytime.`;
  } else {
    return `Withdraw ${amount} ${token} from AAVE back to your wallet.`;
  }
}

/**
 * Status callback for AAVE execution
 */
export interface AaveExecutionStatus {
  status: 'approving' | 'supplying' | 'withdrawing' | 'completed' | 'failed';
  message: string;
  txHash?: string;
}

/**
 * Execute supply to AAVE (for use in ActionCard)
 * This function handles the approve + supply flow
 */
export async function executeAaveSupply(params: {
  chainId: number;
  token: AaveToken;
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
  onUpdate?: (status: AaveExecutionStatus) => void;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const { chainId, token, amount, userAddress, walletClient, publicClient, onUpdate } = params;

  try {
    const addresses = getAaveAddresses(chainId);
    const tokenAddress = (addresses.tokens as Record<string, Address>)[token];
    const decimals = TOKEN_DECIMALS[token];

    if (!tokenAddress) {
      throw new Error(`Token ${token} not supported on chain ${chainId}`);
    }

    // Handle 'max' by reading the user's full token balance
    let amountWei: bigint;
    if (amount === 'max') {
      amountWei = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      });
      if (amountWei === 0n) {
        throw new Error(`No ${token} balance to supply`);
      }
    } else {
      amountWei = parseUnits(amount, decimals);
    }

    // Check allowance first
    onUpdate?.({ status: 'approving', message: 'Checking allowance...' });

    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, addresses.pool],
    });

    // If allowance is insufficient, approve first
    if (allowance < amountWei) {
      onUpdate?.({ status: 'approving', message: 'Approve token spending in wallet...' });

      const approveHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [addresses.pool, amountWei],
      });

      onUpdate?.({ status: 'approving', message: 'Waiting for approval confirmation...', txHash: approveHash });

      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // Execute supply
    onUpdate?.({ status: 'supplying', message: 'Confirm supply in wallet...' });

    const supplyHash = await walletClient.writeContract({
      address: addresses.pool,
      abi: AAVE_POOL_ABI,
      functionName: 'supply',
      args: [tokenAddress, amountWei, userAddress, 0],
    });

    onUpdate?.({ status: 'supplying', message: 'Waiting for confirmation...', txHash: supplyHash });

    await publicClient.waitForTransactionReceipt({ hash: supplyHash });

    onUpdate?.({ status: 'completed', message: 'Supply completed!', txHash: supplyHash });

    return { success: true, txHash: supplyHash };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Supply failed';
    onUpdate?.({ status: 'failed', message: errorMsg });
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute withdraw from AAVE (for use in ActionCard)
 */
export async function executeAaveWithdraw(params: {
  chainId: number;
  token: AaveToken;
  amount: string | 'max';
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
  };
  onUpdate?: (status: AaveExecutionStatus) => void;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const { chainId, token, amount, userAddress, walletClient, publicClient, onUpdate } = params;

  try {
    const addresses = getAaveAddresses(chainId);
    const tokenAddress = (addresses.tokens as Record<string, Address>)[token];
    const decimals = TOKEN_DECIMALS[token];

    // Use max uint for 'max' withdrawal
    const amountWei = amount === 'max'
      ? BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      : parseUnits(amount, decimals);

    if (!tokenAddress) {
      throw new Error(`Token ${token} not supported on chain ${chainId}`);
    }

    onUpdate?.({ status: 'withdrawing', message: 'Confirm withdraw in wallet...' });

    const withdrawHash = await walletClient.writeContract({
      address: addresses.pool,
      abi: AAVE_POOL_ABI,
      functionName: 'withdraw',
      args: [tokenAddress, amountWei, userAddress],
    });

    onUpdate?.({ status: 'withdrawing', message: 'Waiting for confirmation...', txHash: withdrawHash });

    await publicClient.waitForTransactionReceipt({ hash: withdrawHash });

    onUpdate?.({ status: 'completed', message: 'Withdrawal completed!', txHash: withdrawHash });

    return { success: true, txHash: withdrawHash };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Withdrawal failed';
    onUpdate?.({ status: 'failed', message: errorMsg });
    return { success: false, error: errorMsg };
  }
}
