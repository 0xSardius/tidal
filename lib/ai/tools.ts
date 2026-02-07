import { tool } from 'ai';
import { z } from 'zod';
import { parseUnits, formatUnits } from 'viem';
import { getSwapQuote, BASE_TOKENS, type TokenSymbol } from '@/lib/lifi';
import { VAULT_REGISTRY, getVault, getVaultSlugs } from '@/lib/vault-registry';

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

      // Execution time estimate
      const execDuration = result.estimate!.executionDuration;
      const executionTime = execDuration
        ? execDuration < 60 ? `~${execDuration}s` : `~${Math.ceil(execDuration / 60)} min`
        : undefined;

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
        executionTime,
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
          chain: 'Base',
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
      chain: 'Base',
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
      chain: 'Base',
      chainId: 8453, // Base chain ID
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
      chain: 'Base',
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
    const chainId = 8453;

    const fromTokenInfo = BASE_TOKENS[fromToken as TokenSymbol];
    const toTokenInfo = BASE_TOKENS[toToken as TokenSymbol];

    if (!fromTokenInfo || !toTokenInfo) {
      return {
        error: true,
        message: `Token ${fromToken} or ${toToken} not supported.`,
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
        fromAddress: '0x0000000000000000000000000000000000000000',
      });
      if (quoteResult.success && quoteResult.estimate) {
        estimatedSwapOutput = parseFloat(
          formatUnits(BigInt(quoteResult.estimate.toAmount), toTokenInfo.decimals)
        ).toFixed(6);
      }
    } catch {
      // Use fallback estimate
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
 * Scan yield opportunities across protocols on Base via DeFi Llama
 */
export const scanYieldsTool = tool({
  description:
    'Scan yield opportunities across multiple DeFi protocols on Base chain. Uses DeFi Llama to find the best rates. Use this when users ask about yields, best rates, or where to earn. Returns opportunities sorted by APY.',
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
  }),
  execute: async (input) => {
    const { token, maxRisk = 2, limit = 5 } = input;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      params.set('maxRisk', maxRisk.toString());
      params.set('limit', limit.toString());

      const response = await fetch(`${baseUrl}/api/yields?${params}`);
      const data = await response.json();

      if (!data.success || !data.opportunities?.length) {
        return {
          error: false,
          message: 'No yield opportunities found matching your criteria.',
          opportunities: [],
        };
      }

      // Format for the AI to present nicely
      const opportunities = data.opportunities.map(
        (opp: {
          protocol: string;
          symbol: string;
          apy: number;
          apyBase: number | null;
          apyReward: number | null;
          tvlUsd: number;
          riskLevel: number;
          apyMean30d: number | null;
        }) => ({
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
        })
      );

      return {
        opportunities,
        total: data.total,
        chain: 'Base',
        source: 'DeFi Llama',
        note: 'APY data is live from DeFi Llama. Rates change frequently.',
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
    'Prepare a deposit into a curated ERC-4626 vault (Morpho). Available at all tiers. Shallows: steakhouse-prime-usdc, gauntlet-usdc-prime. Mid-Depth adds: moonwell-flagship-usdc, steakhouse-high-yield-usdc, extrafi-xlend-usdc, clearstar-usdc-reactor, moonwell-flagship-eth, seamless-usdc.',
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
  prepareVaultDeposit: prepareVaultDepositTool,
  prepareVaultWithdraw: prepareVaultWithdrawTool,
};
