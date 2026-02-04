import { tool } from 'ai';
import { z } from 'zod';
import { parseUnits, formatUnits } from 'viem';
import { getSwapQuote, BASE_TOKENS, type TokenSymbol } from '@/lib/lifi';

// Supported token symbols for validation
const TOKEN_SYMBOLS = ['USDC', 'WETH', 'ETH', 'DAI'] as const;

/**
 * Get a swap quote from Li.Fi
 */
export const getQuoteTool = tool({
  description: 'Get a quote for swapping tokens via Li.Fi DEX aggregator. Use this to show users the best rates before executing a swap.',
  inputSchema: z.object({
    fromToken: z.enum(['USDC', 'WETH', 'ETH', 'DAI']).describe('Token to swap from'),
    toToken: z.enum(['USDC', 'WETH', 'ETH', 'DAI']).describe('Token to swap to'),
    amount: z.string().describe('Amount to swap (in human readable format, e.g., "100" for 100 USDC)'),
  }),
  execute: async (input) => {
    const { fromToken, toToken, amount } = input;

    // Note: In production, wallet address would come from session/auth
    // For now, use a placeholder - the frontend will handle actual execution
    const walletAddress = '0x0000000000000000000000000000000000000000';
    const chainId = 8453; // Base mainnet

    // Get token info
    const fromTokenInfo = BASE_TOKENS[fromToken as TokenSymbol];
    const toTokenInfo = BASE_TOKENS[toToken as TokenSymbol];

    if (!fromTokenInfo || !toTokenInfo) {
      return {
        error: true,
        message: `Token ${fromToken} or ${toToken} not supported.`,
      };
    }

    try {
      // Convert human-readable amount to wei/smallest unit
      const fromAmountWei = parseUnits(amount, fromTokenInfo.decimals).toString();

      // Call real Li.Fi API
      const result = await getSwapQuote({
        fromToken: fromTokenInfo.address,
        toToken: toTokenInfo.address,
        fromAmount: fromAmountWei,
        fromChain: chainId,
        toChain: chainId,
        fromAddress: walletAddress,
      });

      if (!result.success || !result.quote) {
        return {
          error: true,
          message: result.error || 'Failed to get quote from Li.Fi',
        };
      }

      // Format the response
      const toAmountFormatted = formatUnits(
        BigInt(result.estimate!.toAmount),
        toTokenInfo.decimals
      );

      // Calculate gas cost from estimate
      const gasCosts = result.estimate!.gasCosts;
      const totalGasUsd = gasCosts?.reduce((sum, gc) => sum + parseFloat(gc.amountUSD || '0'), 0) || 0;

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: parseFloat(toAmountFormatted).toFixed(6),
        rate: parseFloat(toAmountFormatted) / parseFloat(amount),
        estimatedGas: totalGasUsd > 0 ? `$${totalGasUsd.toFixed(2)}` : 'Included in quote',
        route: `${fromToken} → Li.Fi (${result.quote.tool}) → ${toToken}`,
        provider: 'Li.Fi',
        toolUsed: result.quote.tool,
      };
    } catch (error) {
      console.error('Li.Fi quote error:', error);
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Failed to get quote',
      };
    }
  },
});

/**
 * Get current AAVE yield rates (real contract data)
 */
export const getAaveRatesTool = tool({
  description: 'Get current APY rates from AAVE lending protocol. Use this to show users the yield they can earn.',
  inputSchema: z.object({
    tokens: z.array(z.enum(['USDC', 'WETH', 'DAI'])).describe('Tokens to get rates for'),
  }),
  execute: async (input) => {
    const { tokens } = input;

    try {
      // Fetch real rates from AAVE contracts via our API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/aave/rates`);
      const data = await response.json();

      if (data.success && data.rates) {
        return tokens.map(token => ({
          token,
          supplyApy: data.rates[token]?.apy || 0,
          protocol: 'AAVE V3',
          chain: 'Base Sepolia',
          live: true, // Indicates this is live data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch AAVE rates:', error);
    }

    // Fallback to static rates if API fails
    const fallbackRates: Record<string, number> = {
      USDC: 3.5,
      WETH: 2.1,
      DAI: 3.2,
    };

    return tokens.map(token => ({
      token,
      supplyApy: fallbackRates[token] || 0,
      protocol: 'AAVE V3',
      chain: 'Base Sepolia',
      live: false, // Indicates this is fallback data
    }));
  },
});

/**
 * Prepare a supply transaction for AAVE (with real APY data)
 */
export const prepareSupplyTool = tool({
  description: 'Prepare a transaction to supply tokens to AAVE for yield. This returns transaction details for user approval.',
  inputSchema: z.object({
    token: z.enum(['USDC', 'WETH']).describe('Token to supply'),
    amount: z.string().describe('Amount to supply (human readable)'),
  }),
  execute: async (input) => {
    const { token, amount } = input;

    // Fetch real APY from API
    let apy = token === 'USDC' ? 3.5 : 2.1; // Fallback
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/aave/rates`);
      const data = await response.json();
      if (data.success && data.rates?.[token]?.apy) {
        apy = data.rates[token].apy;
      }
    } catch (error) {
      console.error('Failed to fetch AAVE rate for supply:', error);
    }

    const yearlyReturn = (parseFloat(amount) * (apy / 100)).toFixed(2);

    return {
      action: 'supply',
      protocol: 'AAVE V3',
      token,
      amount,
      estimatedApy: apy,
      estimatedYearlyReturn: `${yearlyReturn} ${token}`,
      requiresApproval: true,
      chain: 'Base Sepolia',
      chainId: 84532, // Base Sepolia chain ID
      risks: [
        'Smart contract risk (AAVE is audited)',
        'Funds can be withdrawn anytime',
      ],
    };
  },
});

/**
 * Prepare a withdraw transaction from AAVE
 */
export const prepareWithdrawTool = tool({
  description: 'Prepare a transaction to withdraw tokens from AAVE. This returns transaction details for user approval.',
  inputSchema: z.object({
    token: z.enum(['USDC', 'WETH']).describe('Token to withdraw'),
    amount: z.string().describe('Amount to withdraw (human readable), or "max" for full withdrawal'),
  }),
  execute: async (input) => {
    const { token, amount } = input;
    return {
      action: 'withdraw',
      protocol: 'AAVE V3',
      token,
      amount,
      chain: 'Base Sepolia',
      note: amount === 'max' ? 'This will withdraw your entire position including earned interest.' : null,
    };
  },
});

/**
 * Prepare a swap transaction for execution via Li.Fi
 * This returns the data needed for the frontend to execute the swap
 */
export const prepareSwapTool = tool({
  description: 'Prepare a token swap for execution. Use this when the user confirms they want to execute a swap. Returns transaction data for user approval.',
  inputSchema: z.object({
    fromToken: z.enum(TOKEN_SYMBOLS).describe('Token to swap from'),
    toToken: z.enum(TOKEN_SYMBOLS).describe('Token to swap to'),
    amount: z.string().describe('Amount to swap (human readable)'),
  }),
  execute: async (input) => {
    const { fromToken, toToken, amount } = input;
    const chainId = 8453; // Base mainnet

    const fromTokenInfo = BASE_TOKENS[fromToken as TokenSymbol];
    const toTokenInfo = BASE_TOKENS[toToken as TokenSymbol];

    if (!fromTokenInfo || !toTokenInfo) {
      return {
        error: true,
        message: `Token ${fromToken} or ${toToken} not supported.`,
      };
    }

    // Return the swap action for the frontend to execute
    // Frontend will fetch a fresh quote with user's address before executing
    return {
      action: 'swap',
      provider: 'Li.Fi',
      fromToken,
      toToken,
      fromTokenAddress: fromTokenInfo.address,
      toTokenAddress: toTokenInfo.address,
      amount,
      fromDecimals: fromTokenInfo.decimals,
      toDecimals: toTokenInfo.decimals,
      chainId,
      note: 'Li.Fi will find the best route across multiple DEXs.',
      risks: [
        'Swap rates may vary slightly from quote',
        'Transaction requires gas fees (~$0.01-0.05 on Base)',
      ],
    };
  },
});

/**
 * Prepare a swap + supply combo transaction
 */
export const prepareSwapAndSupplyTool = tool({
  description: 'Prepare a combo transaction that swaps tokens via Li.Fi then supplies to AAVE. Use this for users who need to convert their tokens before depositing.',
  inputSchema: z.object({
    fromToken: z.enum(['USDC', 'WETH', 'ETH', 'DAI']).describe('Token user has'),
    toToken: z.enum(['USDC', 'WETH']).describe('Token to supply to AAVE'),
    amount: z.string().describe('Amount of fromToken'),
  }),
  execute: async (input) => {
    const { fromToken, toToken, amount } = input;
    const mockRate = fromToken === 'ETH' && toToken === 'USDC' ? 2200 : 1;
    const swappedAmount = parseFloat(amount) * mockRate;

    return {
      action: 'swap_and_supply',
      steps: [
        {
          step: 1,
          action: 'swap',
          description: `Swap ${amount} ${fromToken} → ${swappedAmount.toFixed(2)} ${toToken} via Li.Fi`,
          provider: 'Li.Fi',
        },
        {
          step: 2,
          action: 'supply',
          description: `Supply ${swappedAmount.toFixed(2)} ${toToken} to AAVE`,
          provider: 'AAVE V3',
        },
      ],
      totalEstimatedApy: toToken === 'USDC' ? 3.5 : 2.1,
      chain: 'Base Sepolia',
      note: 'This is a 2-step transaction. You will need to approve each step.',
    };
  },
});

/**
 * All tools for the AI agent
 */
export const tidalTools = {
  getQuote: getQuoteTool,
  getAaveRates: getAaveRatesTool,
  prepareSupply: prepareSupplyTool,
  prepareWithdraw: prepareWithdrawTool,
  prepareSwap: prepareSwapTool,
  prepareSwapAndSupply: prepareSwapAndSupplyTool,
};
