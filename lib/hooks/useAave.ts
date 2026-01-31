'use client';

import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { maxUint256 } from 'viem';
import {
  AAVE_DATA_PROVIDER_ABI,
  ERC20_ABI,
  getAaveAddresses,
  rayToApy,
  prepareSupplyTx,
  prepareWithdrawTx,
  TOKEN_DECIMALS,
  type AaveToken,
  type AavePosition,
} from '@/lib/aave';

const DEFAULT_CHAIN_ID = baseSepolia.id;

/**
 * Hook to read AAVE reserve data (APY, total supplied)
 */
export function useAaveReserveData(token: AaveToken) {
  const addresses = getAaveAddresses(DEFAULT_CHAIN_ID);
  const tokenAddress = addresses.tokens[token as keyof typeof addresses.tokens];

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses.dataProvider,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: 'getReserveData',
    args: tokenAddress ? [tokenAddress] : undefined,
    chainId: DEFAULT_CHAIN_ID,
    query: {
      enabled: !!tokenAddress,
    },
  });

  const apy = data ? rayToApy(data[5]) : 0; // liquidityRate is at index 5

  return {
    apy,
    liquidityRate: data?.[5],
    totalSupplied: data?.[2], // totalAToken
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read user's AAVE position for a token
 */
export function useAaveUserPosition(token: AaveToken): {
  position: AavePosition | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { address } = useAccount();
  const addresses = getAaveAddresses(DEFAULT_CHAIN_ID);
  const tokenAddress = addresses.tokens[token as keyof typeof addresses.tokens];

  const { data, isLoading, error, refetch } = useReadContract({
    address: addresses.dataProvider,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: 'getUserReserveData',
    args: tokenAddress && address ? [tokenAddress, address] : undefined,
    chainId: DEFAULT_CHAIN_ID,
    query: {
      enabled: !!tokenAddress && !!address,
    },
  });

  const { apy } = useAaveReserveData(token);

  const position: AavePosition | null = data && data[0] > 0n
    ? {
        token,
        suppliedAmount: data[0], // currentATokenBalance
        suppliedFormatted: (Number(data[0]) / 10 ** TOKEN_DECIMALS[token]).toFixed(2),
        currentApy: apy,
      }
    : null;

  return {
    position,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook for AAVE supply operation
 */
export function useAaveSupply() {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);

  const {
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  const {
    data: supplyHash,
    writeContract: writeSupply,
    isPending: isSupplyPending,
    error: supplyError,
    reset: resetSupply,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const { isLoading: isSupplyConfirming, isSuccess: isSupplySuccess } =
    useWaitForTransactionReceipt({ hash: supplyHash });

  const supply = useCallback(
    async (token: AaveToken, amount: bigint) => {
      if (!address) throw new Error('Wallet not connected');

      const txData = prepareSupplyTx({
        chainId: DEFAULT_CHAIN_ID,
        token,
        amount,
        userAddress: address,
      });

      // Step 1: Approve
      setIsApproving(true);
      writeApprove({
        ...txData.approveTx,
        chainId: DEFAULT_CHAIN_ID,
      });
    },
    [address, writeApprove]
  );

  // Watch for approval success, then supply
  const executeSupply = useCallback(
    (token: AaveToken, amount: bigint) => {
      if (!address) return;

      const txData = prepareSupplyTx({
        chainId: DEFAULT_CHAIN_ID,
        token,
        amount,
        userAddress: address,
      });

      setIsApproving(false);
      writeSupply({
        ...txData.supplyTx,
        chainId: DEFAULT_CHAIN_ID,
      });
    },
    [address, writeSupply]
  );

  const reset = useCallback(() => {
    resetApprove();
    resetSupply();
    setIsApproving(false);
  }, [resetApprove, resetSupply]);

  return {
    supply,
    executeSupply,
    reset,
    // State
    isApproving,
    isApprovePending,
    isApproveConfirming,
    isApproveSuccess,
    isSupplyPending,
    isSupplyConfirming,
    isSupplySuccess,
    // Hashes
    approveHash,
    supplyHash,
    // Errors
    approveError,
    supplyError,
    // Combined state
    isPending: isApprovePending || isSupplyPending,
    isConfirming: isApproveConfirming || isSupplyConfirming,
    isSuccess: isSupplySuccess,
    error: approveError || supplyError,
  };
}

/**
 * Hook for AAVE withdraw operation
 */
export function useAaveWithdraw() {
  const { address } = useAccount();

  const {
    data: withdrawHash,
    writeContract,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash });

  const withdraw = useCallback(
    async (token: AaveToken, amount: bigint | 'max') => {
      if (!address) throw new Error('Wallet not connected');

      const withdrawAmount = amount === 'max' ? maxUint256 : amount;

      const txData = prepareWithdrawTx({
        chainId: DEFAULT_CHAIN_ID,
        token,
        amount: withdrawAmount,
        userAddress: address,
      });

      writeContract({
        ...txData.withdrawTx,
        chainId: DEFAULT_CHAIN_ID,
      });
    },
    [address, writeContract]
  );

  return {
    withdraw,
    reset,
    withdrawHash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to get all user AAVE positions
 */
export function useAavePositions() {
  const usdcPosition = useAaveUserPosition('USDC');
  const wethPosition = useAaveUserPosition('WETH');

  const positions = [
    usdcPosition.position,
    wethPosition.position,
  ].filter((p): p is AavePosition => p !== null);

  const totalValueUsd = positions.reduce((sum, p) => {
    // Simplified: assume USDC = $1, ETH price would need oracle
    if (p.token === 'USDC') {
      return sum + Number(p.suppliedFormatted);
    }
    return sum;
  }, 0);

  return {
    positions,
    totalValueUsd,
    isLoading: usdcPosition.isLoading || wethPosition.isLoading,
    refetch: () => {
      usdcPosition.refetch();
      wethPosition.refetch();
    },
  };
}

/**
 * Hook to get current APY rates for display
 */
export function useAaveRates() {
  const usdc = useAaveReserveData('USDC');
  const weth = useAaveReserveData('WETH');

  return {
    USDC: usdc.apy,
    WETH: weth.apy,
    isLoading: usdc.isLoading || weth.isLoading,
  };
}
