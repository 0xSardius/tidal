'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { base } from 'viem/chains';
import type { Route } from '@lifi/sdk';
import { BASE_TOKENS, type TokenSymbol } from '@/lib/lifi';

interface SwapQuote {
  quote: Route;
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    gasCosts: unknown[];
    executionDuration: number;
  };
}

interface SwapState {
  isLoading: boolean;
  error: string | null;
  quote: SwapQuote | null;
  routes: Route[] | null;
}

export function useLifiSwap() {
  const { address } = useAccount();
  const [state, setState] = useState<SwapState>({
    isLoading: false,
    error: null,
    quote: null,
    routes: null,
  });

  const getQuote = useCallback(
    async (params: {
      fromToken: TokenSymbol;
      toToken: TokenSymbol;
      fromAmount: string; // In human readable format (e.g., "100" for 100 USDC)
    }) => {
      if (!address) {
        setState((s) => ({ ...s, error: 'Wallet not connected' }));
        return null;
      }

      const fromTokenInfo = BASE_TOKENS[params.fromToken];
      const toTokenInfo = BASE_TOKENS[params.toToken];

      // Convert to smallest unit
      const fromAmountWei = (
        BigInt(Math.floor(parseFloat(params.fromAmount) * 10 ** fromTokenInfo.decimals))
      ).toString();

      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/lifi/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromToken: fromTokenInfo.address,
            toToken: toTokenInfo.address,
            fromAmount: fromAmountWei,
            fromChain: base.id,
            toChain: base.id,
            fromAddress: address,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setState((s) => ({ ...s, isLoading: false, error: data.error }));
          return null;
        }

        setState((s) => ({
          ...s,
          isLoading: false,
          quote: data,
        }));

        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get quote';
        setState((s) => ({ ...s, isLoading: false, error: message }));
        return null;
      }
    },
    [address]
  );

  const getRoutes = useCallback(
    async (params: {
      fromToken: TokenSymbol;
      toToken: TokenSymbol;
      fromAmount: string;
    }) => {
      if (!address) {
        setState((s) => ({ ...s, error: 'Wallet not connected' }));
        return null;
      }

      const fromTokenInfo = BASE_TOKENS[params.fromToken];
      const toTokenInfo = BASE_TOKENS[params.toToken];

      const fromAmountWei = (
        BigInt(Math.floor(parseFloat(params.fromAmount) * 10 ** fromTokenInfo.decimals))
      ).toString();

      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/lifi/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromToken: fromTokenInfo.address,
            toToken: toTokenInfo.address,
            fromAmount: fromAmountWei,
            fromChain: base.id,
            toChain: base.id,
            fromAddress: address,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setState((s) => ({ ...s, isLoading: false, error: data.error }));
          return null;
        }

        setState((s) => ({
          ...s,
          isLoading: false,
          routes: data.routes,
        }));

        return data.routes;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get routes';
        setState((s) => ({ ...s, isLoading: false, error: message }));
        return null;
      }
    },
    [address]
  );

  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      quote: null,
      routes: null,
    });
  }, []);

  return {
    ...state,
    getQuote,
    getRoutes,
    clearState,
  };
}
