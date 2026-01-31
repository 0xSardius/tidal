'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import { CONTRACTS, TOKENS } from '@/lib/constants';

// ERC20 balanceOf ABI
const erc20BalanceOfAbi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Default values for SSR/unmounted state
const defaultValues = {
  ready: false,
  authenticated: false,
  user: null,
  address: undefined as `0x${string}` | undefined,
  displayAddress: null as string | null,
  isConnected: false,
  embeddedWallet: undefined,
  usdcBalance: '0.00',
  ethBalance: '0.0000',
  login: () => {},
  logout: () => {},
};

export function useWallet() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return default values during SSR
  if (!mounted) {
    return defaultValues;
  }

  return useWalletInternal();
}

function useWalletInternal() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();

  // Get USDC balance using useReadContract
  const { data: usdcBalanceRaw } = useReadContract({
    address: CONTRACTS.USDC,
    abi: erc20BalanceOfAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address,
    },
  });

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    chainId: baseSepolia.id,
  });

  // Get the embedded wallet (Coinbase Smart Wallet)
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

  // Format address for display
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  // Format USDC balance
  const usdcBalance = usdcBalanceRaw
    ? Number(formatUnits(usdcBalanceRaw, TOKENS.USDC.decimals)).toFixed(2)
    : '0.00';

  return {
    // Auth state
    ready,
    authenticated,
    user,

    // Wallet state
    address,
    displayAddress,
    isConnected,
    embeddedWallet,

    // Balances
    usdcBalance,
    ethBalance: ethBalance
      ? Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)
      : '0.0000',

    // Actions
    login,
    logout,
  };
}
