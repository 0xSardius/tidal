import { tool } from 'ai';
import { z } from 'zod';
import { parseUnits, formatUnits } from 'viem';
import { getSwapQuote, BASE_TOKENS, getChainTokens, type TokenSymbol } from '@/lib/lifi';
import { VAULT_REGISTRY, getVault, getVaultSlugs } from '@/lib/vault-registry';
import { TIDAL_CHAINS, chainNameToId, chainIdToName, EXECUTABLE_CHAIN_IDS } from '@/lib/chains';

// Supported token symbols for validation
const TOKEN_SYMBOLS = ['USDC', 'WETH', 'ETH', 'DAI'] as const;
const CHAIN_NAMES = ['Base', 'Arbitrum', 'Optimism'] as const;

/**
 * Get a swap quote from Li.Fi
 */
export const getQuoteTool = tool({
  description: 'Get a quote for swapping tokens via Li.Fi DEX aggregator. Supports same-chain and cross-chain quotes. Use this to show users the best rates before executing a swap.',
  inputSchema: z.object({
    fromToken: z.enum(['USDC', 'WETH', 'ETH', 'DAI']).describe('Token to swap from'),
    toToken: z.enum(['USDC', 'WETH', 'ETH', 'DAI']).describe('Token to swap to'),
    amount: z.string().describe('Amount in TOKEN units, NOT dollar value. For ETH, divide the dollar amount by the current ETH price. For USDC, the dollar amount equals the token amount. NEVER pass a raw dollar number for ETH.'),
    fromChain: z.enum(CHAIN_NAMES).optional().describe('Source chain (default: Base)'),
    toChain: z.enum(CHAIN_NAMES).optional().describe('Destination chain (default: same as fromChain)'),
  }),
  execute: async (input) => {
    const { fromToken, toToken, amount, fromChain = 'Base', toChain } = input;
    const fromChainId = chainNameToId(fromChain) || 8453;
    const toChainId = toChain ? (chainNameToId(toChain) || fromChainId) : fromChainId;

    // Use a real address for quote estimation (Li.Fi rejects the zero address)
    const walletAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

    // Get token info from the appropriate chain
    const fromChainTokens = getChainTokens(fromChainId);
    const toChainTokens = getChainTokens(toChainId);
    const fromTokenInfo = fromChainTokens[fromToken];
    const toTokenInfo = toChainTokens[toToken];

    if (!fromTokenInfo || !toTokenInfo) {
      return {
        error: true,
        message: `Token ${fromToken} or ${toToken} not supported on ${fromChain}/${toChain || fromChain}.`,
      };
    }

    try {
      const fromAmountWei = parseUnits(amount, fromTokenInfo.decimals).toString();

      const result = await getSwapQuote({
        fromToken: fromTokenInfo.address,
        toToken: toTokenInfo.address,
        fromAmount: fromAmountWei,
        fromChain: fromChainId,
        toChain: toChainId,
        fromAddress: walletAddress,
      });

      if (!result.success || !result.quote) {
        return {
          error: true,
          message: result.error || 'Failed to get quote from Li.Fi',
        };
      }

      const toAmountFormatted = formatUnits(
        BigInt(result.estimate!.toAmount),
        toTokenInfo.decimals
      );

      const gasCosts = result.estimate!.gasCosts;
      const totalGasUsd = gasCosts?.reduce((sum, gc) => sum + parseFloat(gc.amountUSD || '0'), 0) || 0;

      const execDuration = result.estimate!.executionDuration;
      const executionTime = execDuration
        ? execDuration < 60 ? `~${execDuration}s` : `~${Math.ceil(execDuration / 60)} min`
        : undefined;

      const isCrossChain = fromChainId !== toChainId;

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: parseFloat(toAmountFormatted).toFixed(6),
        rate: parseFloat(toAmountFormatted) / parseFloat(amount),
        estimatedGas: totalGasUsd > 0 ? `$${totalGasUsd.toFixed(2)}` : 'Included in quote',
        route: isCrossChain
          ? `${fromToken} (${fromChain}) → Li.Fi (${result.quote.tool}) → ${toToken} (${toChain || fromChain})`
          : `${fromToken} → Li.Fi (${result.quote.tool}) → ${toToken}`,
        provider: 'Li.Fi',
        toolUsed: result.quote.tool,
        executionTime,
        fromChain,
        toChain: toChain || fromChain,
        isCrossChain,
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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/aave/rates`);
      const data = await response.json();

      if (data.success && data.rates) {
        return tokens.map(token => ({
          token,
          supplyApy: data.rates[token]?.apy || 0,
          protocol: 'AAVE V3',
          chain: 'Base',
          live: true,
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
      chain: 'Base',
      live: false,
    }));
  },
});

/**
 * Prepare a supply transaction for AAVE (with real APY data)
 */
export const prepareSupplyTool = tool({
  description: 'Prepare a transaction to supply tokens to AAVE for yield. Supports Base, Arbitrum, and Optimism.',
  inputSchema: z.object({
    token: z.enum(['USDC', 'WETH']).describe('Token to supply'),
    amount: z.string().describe('Amount to supply (human readable)'),
    chain: z.enum(CHAIN_NAMES).optional().describe('Chain to supply on (default: Base)'),
  }),
  execute: async (input) => {
    const { token, amount, chain = 'Base' } = input;
    const chainId = chainNameToId(chain) || 8453;

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
      chain,
      chainId,
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
  description: 'Prepare a transaction to withdraw tokens from AAVE. Supports Base, Arbitrum, and Optimism.',
  inputSchema: z.object({
    token: z.enum(['USDC', 'WETH']).describe('Token to withdraw'),
    amount: z.string().describe('Amount to withdraw (human readable), or "max" for full withdrawal'),
    chain: z.enum(CHAIN_NAMES).optional().describe('Chain to withdraw on (default: Base)'),
  }),
  execute: async (input) => {
    const { token, amount, chain = 'Base' } = input;
    const chainId = chainNameToId(chain) || 8453;
    return {
      action: 'withdraw',
      protocol: 'AAVE V3',
      token,
      amount,
      chain,
      chainId,
      note: amount === 'max' ? 'This will withdraw your entire position including earned interest.' : null,
    };
  },
});

/**
 * Prepare a swap transaction for execution via Li.Fi
 */
export const prepareSwapTool = tool({
  description: 'Prepare a token swap for execution. Supports same-chain and cross-chain swaps via Li.Fi.',
  inputSchema: z.object({
    fromToken: z.enum(TOKEN_SYMBOLS).describe('Token to swap from'),
    toToken: z.enum(TOKEN_SYMBOLS).describe('Token to swap to'),
    amount: z.string().describe('Amount to swap (human readable)'),
    fromChain: z.enum(CHAIN_NAMES).optional().describe('Source chain (default: Base)'),
    toChain: z.enum(CHAIN_NAMES).optional().describe('Destination chain (default: same as fromChain)'),
  }),
  execute: async (input) => {
    const { fromToken, toToken, amount, fromChain = 'Base', toChain } = input;
    const fromChainId = chainNameToId(fromChain) || 8453;
    const toChainId = toChain ? (chainNameToId(toChain) || fromChainId) : fromChainId;

    const fromChainTokens = getChainTokens(fromChainId);
    const toChainTokens = getChainTokens(toChainId);
    const fromTokenInfo = fromChainTokens[fromToken];
    const toTokenInfo = toChainTokens[toToken];

    if (!fromTokenInfo || !toTokenInfo) {
      return {
        error: true,
        message: `Token ${fromToken} or ${toToken} not supported on ${fromChain}/${toChain || fromChain}.`,
      };
    }

    const isCrossChain = fromChainId !== toChainId;

    return {
      action: isCrossChain ? 'bridge' : 'swap',
      provider: 'Li.Fi',
      fromToken,
      toToken,
      fromTokenAddress: fromTokenInfo.address,
      toTokenAddress: toTokenInfo.address,
      amount,
      fromDecimals: fromTokenInfo.decimals,
      toDecimals: toTokenInfo.decimals,
      fromChainId,
      toChainId,
      chainId: fromChainId,
      note: isCrossChain
        ? `Li.Fi will bridge ${fromToken} from ${fromChain} to ${toChain} via the optimal bridge.`
        : 'Li.Fi will find the best route across multiple DEXs.',
      risks: isCrossChain
        ? [
            'Bridge times vary (1-15 minutes depending on the bridge)',
            'Cross-chain rates may differ from quote due to bridge fees',
            'Ensure you have ETH for gas on the destination chain',
          ]
        : [
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
    amount: z.string().describe('Amount of fromToken in TOKEN units, NOT dollar value. For ETH: "0.0004" for ~$1 worth. For USDC: "1" for $1. Always convert dollar amounts to token amounts.'),
    chain: z.enum(CHAIN_NAMES).optional().describe('Chain to execute on (default: Base)'),
  }),
  execute: async (input) => {
    const { fromToken, toToken, amount, chain = 'Base' } = input;
    const chainId = chainNameToId(chain) || 8453;

    const chainTokens = getChainTokens(chainId);
    const fromTokenInfo = chainTokens[fromToken];
    const toTokenInfo = chainTokens[toToken];

    if (!fromTokenInfo || !toTokenInfo) {
      return {
        error: true,
        message: `Token ${fromToken} or ${toToken} not supported on ${chain}.`,
      };
    }

    // Get a quote to estimate the swap output
    let estimatedSwapOutput = amount;
    try {
      const fromAmountWei = parseUnits(amount, fromTokenInfo.decimals).toString();
      const quoteResult = await getSwapQuote({
        fromToken: fromTokenInfo.address,
        toToken: toTokenInfo.address,
        fromAmount: fromAmountWei,
        fromChain: chainId,
        toChain: chainId,
        fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      });
      if (quoteResult.success && quoteResult.estimate) {
        estimatedSwapOutput = parseFloat(
          formatUnits(BigInt(quoteResult.estimate.toAmount), toTokenInfo.decimals)
        ).toFixed(6);
      } else {
        console.error('Li.Fi quote failed in swap+supply:', quoteResult.error);
      }
    } catch (err) {
      console.error('Li.Fi quote error in swap+supply:', err);
    }

    // Fetch real APY for the supply step
    let apy = toToken === 'USDC' ? 3.5 : 2.1;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/aave/rates`);
      const data = await response.json();
      if (data.success && data.rates?.[toToken]?.apy) {
        apy = data.rates[toToken].apy;
      }
    } catch {
      // Use fallback APY
    }

    const yearlyReturn = (parseFloat(estimatedSwapOutput) * (apy / 100)).toFixed(2);

    return {
      action: 'swap_and_supply',
      provider: 'Li.Fi + AAVE V3',
      fromToken,
      toToken,
      fromTokenAddress: fromTokenInfo.address,
      toTokenAddress: toTokenInfo.address,
      amount,
      fromDecimals: fromTokenInfo.decimals,
      toDecimals: toTokenInfo.decimals,
      chainId,
      estimatedSwapOutput,
      estimatedApy: apy,
      estimatedYearlyReturn: `${yearlyReturn} ${toToken}`,
      steps: [
        {
          step: 1,
          action: 'swap',
          description: `Swap ${amount} ${fromToken} → ~${estimatedSwapOutput} ${toToken} via Li.Fi`,
          provider: 'Li.Fi',
        },
        {
          step: 2,
          action: 'supply',
          description: `Supply ~${estimatedSwapOutput} ${toToken} to AAVE at ${apy.toFixed(2)}% APY`,
          provider: 'AAVE V3',
        },
      ],
      risks: [
        'Swap rates may vary slightly from estimate',
        'Smart contract risk (both Li.Fi and AAVE are audited)',
        'Funds supplied to AAVE can be withdrawn anytime',
      ],
      note: 'This is a 2-step transaction: Li.Fi swap then AAVE supply.',
    };
  },
});

/**
 * Prepare a cross-chain bridge via Li.Fi
 */
export const prepareBridgeTool = tool({
  description: 'Prepare a cross-chain bridge transaction via Li.Fi. Bridges tokens from one chain to another. Li.Fi finds the optimal bridge (Stargate, Across, CCTP, etc.).',
  inputSchema: z.object({
    fromChain: z.enum(CHAIN_NAMES).describe('Source chain'),
    toChain: z.enum(CHAIN_NAMES).describe('Destination chain'),
    token: z.enum(['USDC', 'WETH', 'ETH']).describe('Token to bridge'),
    amount: z.string().describe('Amount to bridge (human readable)'),
  }),
  execute: async (input) => {
    const { fromChain, toChain, token, amount } = input;
    const fromChainId = chainNameToId(fromChain)!;
    const toChainId = chainNameToId(toChain)!;

    if (fromChainId === toChainId) {
      return { error: true, message: 'Source and destination chains must be different. Use prepareSwap for same-chain swaps.' };
    }

    const fromChainTokens = getChainTokens(fromChainId);
    const toChainTokens = getChainTokens(toChainId);
    const fromTokenInfo = fromChainTokens[token];
    const toTokenInfo = toChainTokens[token];

    if (!fromTokenInfo || !toTokenInfo) {
      return { error: true, message: `Token ${token} not available on both ${fromChain} and ${toChain}.` };
    }

    // Get a real bridge quote from Li.Fi
    let bridgeCost = '$0.50';
    let estimatedTime = '~3 min';
    let toolUsed = 'Unknown';

    try {
      const fromAmountWei = parseUnits(amount, fromTokenInfo.decimals).toString();
      const quoteResult = await getSwapQuote({
        fromToken: fromTokenInfo.address,
        toToken: toTokenInfo.address,
        fromAmount: fromAmountWei,
        fromChain: fromChainId,
        toChain: toChainId,
        fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      });

      if (quoteResult.success && quoteResult.estimate) {
        const gasCosts = quoteResult.estimate.gasCosts;
        const totalGasUsd = gasCosts?.reduce((sum, gc) => sum + parseFloat(gc.amountUSD || '0'), 0) || 0;
        bridgeCost = totalGasUsd > 0 ? `$${totalGasUsd.toFixed(2)}` : '$0.50';

        const execDuration = quoteResult.estimate.executionDuration;
        estimatedTime = execDuration
          ? execDuration < 60 ? `~${execDuration}s` : `~${Math.ceil(execDuration / 60)} min`
          : '~3 min';

        toolUsed = quoteResult.quote?.tool || 'Unknown';
      }
    } catch (err) {
      console.error('Bridge quote error:', err);
    }

    return {
      action: 'bridge',
      provider: 'Li.Fi',
      fromToken: token,
      toToken: token,
      fromTokenAddress: fromTokenInfo.address,
      toTokenAddress: toTokenInfo.address,
      amount,
      fromDecimals: fromTokenInfo.decimals,
      toDecimals: toTokenInfo.decimals,
      fromChainId,
      toChainId,
      chainId: fromChainId,
      bridgeCost,
      estimatedTime,
      toolUsed,
      fromChain,
      toChain,
      note: `Bridging ${amount} ${token} from ${fromChain} to ${toChain} via Li.Fi (${toolUsed}). Estimated cost: ${bridgeCost}, time: ${estimatedTime}.`,
      risks: [
        `Bridge times vary (1-15 minutes depending on ${toolUsed})`,
        'Cross-chain rates may differ slightly from quote',
        `Ensure you have ETH for gas on ${toChain}`,
      ],
    };
  },
});

/**
 * Prepare a cross-chain yield move: bridge + deposit to AAVE on destination chain
 */
export const prepareCrossChainYieldTool = tool({
  description: 'Prepare a cross-chain yield strategy: bridge tokens via Li.Fi to another chain, then deposit to AAVE. This is the star feature — finds better yields on other chains and moves funds there automatically.',
  inputSchema: z.object({
    fromChain: z.enum(CHAIN_NAMES).describe('Source chain where funds currently are'),
    toChain: z.enum(CHAIN_NAMES).describe('Destination chain with better yield'),
    token: z.enum(['USDC', 'WETH']).describe('Token to bridge and deposit'),
    amount: z.string().describe('Amount to move (human readable)'),
  }),
  execute: async (input) => {
    const { fromChain, toChain, token, amount } = input;
    const fromChainId = chainNameToId(fromChain)!;
    const toChainId = chainNameToId(toChain)!;

    if (fromChainId === toChainId) {
      return { error: true, message: 'Source and destination must be different chains. Use prepareSupply for same-chain deposits.' };
    }

    const fromChainTokens = getChainTokens(fromChainId);
    const toChainTokens = getChainTokens(toChainId);
    const fromTokenInfo = fromChainTokens[token];
    const toTokenInfo = toChainTokens[token];

    if (!fromTokenInfo || !toTokenInfo) {
      return { error: true, message: `Token ${token} not available on both ${fromChain} and ${toChain}.` };
    }

    // Get bridge quote
    let bridgeCost = 0.50;
    let estimatedTime = '~3 min';
    let toolUsed = 'Stargate';

    try {
      const fromAmountWei = parseUnits(amount, fromTokenInfo.decimals).toString();
      const quoteResult = await getSwapQuote({
        fromToken: fromTokenInfo.address,
        toToken: toTokenInfo.address,
        fromAmount: fromAmountWei,
        fromChain: fromChainId,
        toChain: toChainId,
        fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      });

      if (quoteResult.success && quoteResult.estimate) {
        const gasCosts = quoteResult.estimate.gasCosts;
        bridgeCost = gasCosts?.reduce((sum, gc) => sum + parseFloat(gc.amountUSD || '0'), 0) || 0.50;

        const execDuration = quoteResult.estimate.executionDuration;
        estimatedTime = execDuration
          ? execDuration < 60 ? `~${execDuration}s` : `~${Math.ceil(execDuration / 60)} min`
          : '~3 min';

        toolUsed = quoteResult.quote?.tool || 'Stargate';
      }
    } catch (err) {
      console.error('Cross-chain quote error:', err);
    }

    // Fetch destination chain AAVE APY
    let destApy = token === 'USDC' ? 4.0 : 2.5;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/yields?token=${token}&chains=${toChain}&maxRisk=1&limit=5`);
      const data = await response.json();
      if (data.success && data.opportunities?.length) {
        const aaveOpp = data.opportunities.find((o: { protocol: string }) =>
          o.protocol.toLowerCase().includes('aave')
        );
        if (aaveOpp) destApy = aaveOpp.apy;
      }
    } catch {
      // Use fallback APY
    }

    const yearlyReturn = (parseFloat(amount) * (destApy / 100)).toFixed(2);
    const breakEvenDays = bridgeCost > 0
      ? Math.ceil((bridgeCost / (parseFloat(amount) * (destApy / 100) / 365)))
      : 0;

    return {
      action: 'cross_chain_yield',
      provider: 'Li.Fi + AAVE V3',
      fromToken: token,
      toToken: token,
      token,
      fromTokenAddress: fromTokenInfo.address,
      toTokenAddress: toTokenInfo.address,
      amount,
      fromDecimals: fromTokenInfo.decimals,
      toDecimals: toTokenInfo.decimals,
      fromChainId,
      toChainId,
      chainId: fromChainId,
      estimatedApy: destApy,
      estimatedYearlyReturn: `${yearlyReturn} ${token}`,
      bridgeCost: `$${bridgeCost.toFixed(2)}`,
      estimatedTime,
      breakEvenDays,
      toolUsed,
      fromChain,
      toChain,
      steps: [
        {
          step: 1,
          action: 'bridge',
          description: `Bridge ${amount} ${token} from ${fromChain} → ${toChain} via Li.Fi (${toolUsed})`,
          provider: 'Li.Fi',
        },
        {
          step: 2,
          action: 'supply',
          description: `Supply ${amount} ${token} to AAVE on ${toChain} at ${destApy.toFixed(2)}% APY`,
          provider: 'AAVE V3',
        },
      ],
      risks: [
        `Bridge cost: ~$${bridgeCost.toFixed(2)} (break-even in ~${breakEvenDays} days)`,
        `Bridge time: ${estimatedTime} via ${toolUsed}`,
        `Ensure you have ETH for gas on ${toChain}`,
        'Smart contract risk (both Li.Fi and AAVE are audited)',
      ],
      note: `Cross-chain yield move: Bridge ${token} via Li.Fi (${toolUsed}) then deposit to AAVE on ${toChain} for ${destApy.toFixed(2)}% APY. Break-even: ~${breakEvenDays} days.`,
    };
  },
});

/**
 * Scan yield opportunities across protocols and chains via DeFi Llama
 */
export const scanYieldsTool = tool({
  description:
    'Scan yield opportunities across multiple DeFi protocols and chains. Uses DeFi Llama to find the best rates. Supports Base, Arbitrum, Optimism, Polygon, Ethereum, and Solana. Base, Arbitrum, and Optimism yields are executable (bridge + deposit). Use this when users ask about yields, best rates, or where to earn.',
  inputSchema: z.object({
    token: z
      .enum(['USDC', 'WETH', 'ETH', 'DAI'])
      .optional()
      .describe('Filter by token (optional). If not provided, returns all tokens.'),
    maxRisk: z
      .number()
      .min(1)
      .max(3)
      .optional()
      .describe(
        'Maximum risk level: 1=Shallows (stablecoin lending, blue-chip), 2=Mid-Depth (single-asset, established), 3=Deep Water (all including LP). Defaults to user risk depth.'
      ),
    limit: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .describe('Number of results to return (default 5)'),
    chains: z
      .array(z.string())
      .optional()
      .describe(
        'Filter by chains (optional). e.g. ["Base", "Arbitrum"]. If not provided, scans all supported chains: Base, Arbitrum, Optimism, Polygon, Ethereum, Solana.'
      ),
  }),
  execute: async (input) => {
    const { token, maxRisk = 2, limit = 5, chains } = input;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      params.set('maxRisk', maxRisk.toString());
      params.set('limit', limit.toString());
      if (chains && chains.length > 0) params.set('chains', chains.join(','));

      const response = await fetch(`${baseUrl}/api/yields?${params}`);
      const data = await response.json();

      if (!data.success || !data.opportunities?.length) {
        return {
          error: false,
          message: 'No yield opportunities found matching your criteria.',
          opportunities: [],
        };
      }

      const opportunities = data.opportunities.map(
        (opp: {
          chain: string;
          protocol: string;
          symbol: string;
          apy: number;
          apyBase: number | null;
          apyReward: number | null;
          tvlUsd: number;
          riskLevel: number;
          apyMean30d: number | null;
        }) => ({
          chain: opp.chain,
          protocol: opp.protocol,
          token: opp.symbol,
          apy: opp.apy,
          apyBase: opp.apyBase,
          apyReward: opp.apyReward,
          tvlUsd: opp.tvlUsd,
          tvlFormatted:
            opp.tvlUsd >= 1_000_000
              ? `$${(opp.tvlUsd / 1_000_000).toFixed(1)}M`
              : `$${(opp.tvlUsd / 1_000).toFixed(0)}K`,
          riskLevel: opp.riskLevel,
          apyMean30d: opp.apyMean30d,
          executable: ['Base', 'Arbitrum', 'Optimism'].includes(opp.chain),
        })
      );

      return {
        opportunities,
        total: data.total,
        chains: data.chains,
        source: 'DeFi Llama',
        note: 'APY data is live from DeFi Llama. Base, Arbitrum, and Optimism yields are executable — use prepareCrossChainYield to bridge + deposit. Other chains are informational.',
      };
    } catch (error) {
      console.error('Yield scan error:', error);
      return {
        error: true,
        message: 'Failed to scan yields. Try again or check specific protocols.',
      };
    }
  },
});

/**
 * Prepare a deposit into an ERC-4626 vault (Morpho, etc.)
 */
export const prepareVaultDepositTool = tool({
  description:
    'Prepare a deposit into a curated ERC-4626 vault (Morpho, YO Protocol). Available at all tiers. Shallows: steakhouse-prime-usdc, gauntlet-usdc-prime. Mid-Depth adds: yo-usdc (8.6% APY!), yo-eth, moonwell-flagship-usdc, steakhouse-high-yield-usdc, extrafi-xlend-usdc, clearstar-usdc-reactor, moonwell-flagship-eth, seamless-usdc.',
  inputSchema: z.object({
    vaultSlug: z
      .string()
      .describe(
        `Vault identifier. Available: ${getVaultSlugs().join(', ')}`
      ),
    amount: z.string().describe('Amount to deposit (human readable, e.g., "100")'),
  }),
  execute: async (input) => {
    const { vaultSlug, amount } = input;
    const vault = getVault(vaultSlug);

    if (!vault) {
      return {
        error: true,
        message: `Vault "${vaultSlug}" not found. Available vaults: ${getVaultSlugs().join(', ')}`,
      };
    }

    // Fetch live APY from DeFi Llama for this vault's protocol
    let apy: number | null = null;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(
        `${baseUrl}/api/yields?token=${vault.underlyingToken}&maxRisk=3&limit=20`
      );
      const data = await response.json();
      if (data.success && data.opportunities) {
        const match = data.opportunities.find(
          (o: { protocol: string }) => o.protocol === vault.protocol
        );
        if (match) apy = match.apy;
      }
    } catch {
      // Use null - will show "Live rate" note
    }

    const yearlyReturn = apy
      ? (parseFloat(amount) * (apy / 100)).toFixed(2)
      : null;

    return {
      action: 'vault_deposit',
      protocol: vault.protocol,
      vaultSlug,
      vaultName: vault.name,
      curator: vault.curator,
      token: vault.underlyingToken,
      amount,
      vaultAddress: vault.address,
      underlyingAddress: vault.underlyingAddress,
      underlyingDecimals: vault.underlyingDecimals,
      chainId: vault.chainId,
      estimatedApy: apy,
      estimatedYearlyReturn: yearlyReturn
        ? `${yearlyReturn} ${vault.underlyingToken}`
        : undefined,
      description: vault.description,
      risks: [
        `Smart contract risk (${vault.curator}-curated vault)`,
        'ERC-4626 standard - funds can be withdrawn anytime',
        'Yields are variable and may change',
      ],
      note: `Depositing into ${vault.name}, curated by ${vault.curator}.`,
    };
  },
});

/**
 * Prepare a withdrawal from an ERC-4626 vault
 */
export const prepareVaultWithdrawTool = tool({
  description:
    'Prepare a withdrawal from an ERC-4626 vault. Returns transaction details for user approval.',
  inputSchema: z.object({
    vaultSlug: z
      .string()
      .describe(
        `Vault identifier. Available: ${getVaultSlugs().join(', ')}`
      ),
    amount: z
      .string()
      .describe('Amount to withdraw (human readable), or "max" for full withdrawal'),
  }),
  execute: async (input) => {
    const { vaultSlug, amount } = input;
    const vault = getVault(vaultSlug);

    if (!vault) {
      return {
        error: true,
        message: `Vault "${vaultSlug}" not found. Available vaults: ${getVaultSlugs().join(', ')}`,
      };
    }

    return {
      action: 'vault_withdraw',
      protocol: vault.protocol,
      vaultSlug,
      vaultName: vault.name,
      curator: vault.curator,
      token: vault.underlyingToken,
      amount,
      vaultAddress: vault.address,
      underlyingAddress: vault.underlyingAddress,
      underlyingDecimals: vault.underlyingDecimals,
      chainId: vault.chainId,
      note:
        amount === 'max'
          ? `This will withdraw your entire position from ${vault.name}.`
          : null,
    };
  },
});

/**
 * All tools for the AI agent
 */
export const tidalTools = {
  getQuote: getQuoteTool,
  getAaveRates: getAaveRatesTool,
  scanYields: scanYieldsTool,
  prepareSupply: prepareSupplyTool,
  prepareWithdraw: prepareWithdrawTool,
  prepareSwap: prepareSwapTool,
  prepareSwapAndSupply: prepareSwapAndSupplyTool,
  prepareBridge: prepareBridgeTool,
  prepareCrossChainYield: prepareCrossChainYieldTool,
  prepareVaultDeposit: prepareVaultDepositTool,
  prepareVaultWithdraw: prepareVaultWithdrawTool,
};
