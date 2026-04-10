import { tool } from 'ai';
import { z } from 'zod';
import { getSwapOrder, formatSwapOrder } from '@/lib/solana/jupiter-swap';
import { prepareStake, prepareUnstake, getJitoRate, getJitoPosition } from '@/lib/solana/jito';
import {
  prepareLend,
  prepareWithdraw,
  prepareJupiterLend,
  getKaminoRates,
  getJupiterLendRates,
  compareRates,
} from '@/lib/solana/kamino';
import { getWalletBalances } from '@/lib/solana/connection';
import { getStrategiesForTier, getStrategiesForToken } from '@/lib/solana/registry';
import { MINTS, SOLANA_TOKENS, resolveDecimals } from '@/lib/solana/constants';

// Token enums for strict validation
const SOLANA_TOKEN_SYMBOLS = ['SOL', 'USDC', 'USDT', 'JITOSOL'] as const;
const SWAP_TOKENS = ['SOL', 'USDC', 'USDT', 'JITOSOL', 'MSOL', 'BSOL', 'INF'] as const;

// --- Swap Tool ---

export const swapTokenTool = tool({
  description:
    'Swap any Solana token via Jupiter aggregator. Returns a transaction for the user to sign. ' +
    'Use this when the user wants to swap tokens, or when they need a different token for a strategy ' +
    '(e.g., swap SOL to USDC before lending).',
  inputSchema: z.object({
    fromToken: z.enum(SWAP_TOKENS).describe('Token to swap from'),
    toToken: z.enum(SWAP_TOKENS).describe('Token to swap to'),
    amount: z.string().describe(
      'Amount in token units (not dollar value). For SOL use SOL amount, for USDC use USDC amount.',
    ),
    walletAddress: z.string().describe('User Solana wallet address (base58)'),
    slippageBps: z.number().optional().describe('Slippage tolerance in basis points (default: 50 = 0.5%)'),
  }),
  execute: async (input) => {
    const { fromToken, toToken, amount, walletAddress, slippageBps = 50 } = input;

    if (fromToken === toToken) {
      return { error: true, message: `Cannot swap ${fromToken} to itself.` };
    }

    try {
      const inputMint = MINTS[fromToken as keyof typeof MINTS]?.toBase58();
      const outputMint = MINTS[toToken as keyof typeof MINTS]?.toBase58();

      if (!inputMint || !outputMint) {
        return { error: true, message: `Token ${fromToken} or ${toToken} not recognized.` };
      }

      const decimals = resolveDecimals(inputMint);
      const amountBaseUnits = Math.floor(parseFloat(amount) * 10 ** decimals).toString();

      const order = await getSwapOrder({
        inputMint,
        outputMint,
        amount: amountBaseUnits,
        taker: walletAddress,
        slippageBps,
      });

      return formatSwapOrder(order);
    } catch (err) {
      return {
        error: true,
        message: `Swap failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

// --- Staking Tool ---

export const stakeSOLTool = tool({
  description:
    'Stake SOL to receive JitoSOL (liquid staked SOL with MEV rewards). ' +
    'JitoSOL earns ~5-7% APY from staking rewards + MEV tips. ' +
    'This is a Shallows-safe strategy. The user keeps liquidity via JitoSOL.',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of SOL to stake'),
    walletAddress: z.string().describe('User Solana wallet address'),
  }),
  execute: async (input) => {
    try {
      return await prepareStake({
        wallet: input.walletAddress,
        amountSol: input.amount,
      });
    } catch (err) {
      return {
        error: true,
        message: `Staking failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

// --- Unstaking Tool ---

export const unstakeSOLTool = tool({
  description:
    'Unstake JitoSOL back to SOL via Jupiter swap (instant). ' +
    'Use when the user wants to exit their staking position.',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of JitoSOL to unstake'),
    walletAddress: z.string().describe('User Solana wallet address'),
  }),
  execute: async (input) => {
    try {
      return await prepareUnstake({
        wallet: input.walletAddress,
        amountJitoSol: input.amount,
      });
    } catch (err) {
      return {
        error: true,
        message: `Unstaking failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

// --- Lending Tool ---

export const lendUSDCTool = tool({
  description:
    'Lend USDC (or USDT) on either Kamino Lend or Jupiter Lend. ' +
    'The AI automatically picks the protocol with the better rate, or the user can specify. ' +
    'Both are Shallows-safe strategies with variable APY. Withdraw anytime.',
  inputSchema: z.object({
    token: z.enum(['USDC', 'USDT']).describe('Stablecoin to lend'),
    amount: z.number().positive().describe('Amount of stablecoin to lend'),
    walletAddress: z.string().describe('User Solana wallet address'),
    protocol: z
      .enum(['kamino', 'jupiter-lend', 'best'])
      .optional()
      .describe('Protocol to use. "best" (default) picks the higher APY automatically.'),
  }),
  execute: async (input) => {
    const { token, amount, walletAddress, protocol = 'best' } = input;

    try {
      if (protocol === 'best') {
        const comparison = await compareRates(token);
        if (comparison.recommendation === 'kamino') {
          return await prepareLend({ wallet: walletAddress, token, amount });
        } else {
          return await prepareJupiterLend({ wallet: walletAddress, token, amount });
        }
      } else if (protocol === 'kamino') {
        return await prepareLend({ wallet: walletAddress, token, amount });
      } else {
        return await prepareJupiterLend({ wallet: walletAddress, token, amount });
      }
    } catch (err) {
      return {
        error: true,
        message: `Lending failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

// --- Withdraw Lending Tool ---

export const withdrawLendTool = tool({
  description:
    'Withdraw stablecoins from Kamino Lend or Jupiter Lend. ' +
    'Funds return to the wallet immediately.',
  inputSchema: z.object({
    token: z.enum(['USDC', 'USDT']).describe('Token to withdraw'),
    amount: z.number().positive().describe('Amount to withdraw'),
    walletAddress: z.string().describe('User Solana wallet address'),
    protocol: z.enum(['kamino', 'jupiter-lend']).describe('Protocol to withdraw from'),
  }),
  execute: async (input) => {
    try {
      return await prepareWithdraw({
        wallet: input.walletAddress,
        token: input.token,
        amount: input.amount,
      });
    } catch (err) {
      return {
        error: true,
        message: `Withdrawal failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

// --- Rate Scanning Tools ---

export const getSolanaRatesTool = tool({
  description:
    'Get live APY rates from Solana lending and staking protocols. ' +
    'Returns current rates for JitoSOL staking, Kamino lending, and Jupiter Lend. ' +
    'Use this to answer questions like "what are the current rates?" or "where should I put my USDC?"',
  inputSchema: z.object({
    token: z
      .enum(['USDC', 'USDT', 'SOL'])
      .optional()
      .describe('Filter by token. If omitted, returns all available rates.'),
  }),
  execute: async (input) => {
    const rates: Array<{
      protocol: string;
      strategy: string;
      token: string;
      apy: number;
      riskLevel: number;
      note: string;
    }> = [];

    try {
      // Always fetch staking rates
      if (!input.token || input.token === 'SOL') {
        const jito = await getJitoRate();
        rates.push({
          protocol: 'Jito',
          strategy: 'Liquid Staking (JitoSOL)',
          token: 'SOL',
          apy: jito.apy,
          riskLevel: 1,
          note: `Stake SOL → JitoSOL. Earns staking rewards + MEV tips. Rate: 1 JitoSOL = ${jito.exchangeRate.toFixed(4)} SOL.`,
        });
      }

      // Fetch lending rates for stablecoins
      if (!input.token || input.token === 'USDC' || input.token === 'USDT') {
        const token = input.token || 'USDC';
        const [kamino, jupLend] = await Promise.all([
          getKaminoRates(token),
          getJupiterLendRates(token),
        ]);

        rates.push({
          protocol: 'Kamino',
          strategy: `${token} Lending`,
          token,
          apy: kamino.supplyApy,
          riskLevel: 1,
          note: `Supply ${token} to Kamino Lend. ${kamino.utilization > 0 ? `Utilization: ${kamino.utilization.toFixed(1)}%` : ''}`,
        });

        rates.push({
          protocol: 'Jupiter Lend',
          strategy: `${token} Lending`,
          token,
          apy: jupLend.supplyApy,
          riskLevel: 1,
          note: `Supply ${token} to Jupiter Lend. Isolated vaults, 0.1% liquidation penalty.`,
        });
      }

      // Sort by APY descending
      rates.sort((a, b) => b.apy - a.apy);

      return {
        rates,
        summary: rates.map(r =>
          `${r.protocol} ${r.strategy}: ${r.apy.toFixed(2)}% APY`,
        ).join('\n'),
        note: 'Rates are live from DeFi Llama and protocol APIs. APYs are variable.',
      };
    } catch (err) {
      return {
        error: true,
        message: `Failed to fetch rates: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

export const compareYieldsTool = tool({
  description:
    'Compare stablecoin yields across Kamino and Jupiter Lend side-by-side. ' +
    'Use when the user asks "where should I put my USDC?" or "which protocol is better?"',
  inputSchema: z.object({
    token: z.enum(['USDC', 'USDT']).optional().describe('Token to compare (default: USDC)'),
  }),
  execute: async (input) => {
    try {
      const comparison = await compareRates(input.token || 'USDC');
      return {
        kamino: {
          apy: comparison.kamino.supplyApy,
          utilization: comparison.kamino.utilization,
          tvl: comparison.kamino.totalSupply,
        },
        jupiterLend: {
          apy: comparison.jupiterLend.supplyApy,
          totalDeposits: comparison.jupiterLend.totalDeposits,
        },
        recommendation: comparison.recommendation,
        note: comparison.note,
      };
    } catch (err) {
      return {
        error: true,
        message: `Comparison failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

// --- Yield Scanning (reuses existing DeFi Llama route) ---

export const scanSolanaYieldsTool = tool({
  description:
    'Scan Solana yield opportunities across DeFi protocols via DeFi Llama. ' +
    'Returns the top yields filtered by token and risk level. ' +
    'Use this for broad yield discovery beyond just Kamino and Jupiter Lend.',
  inputSchema: z.object({
    token: z
      .enum(['USDC', 'USDT', 'SOL', 'ETH'])
      .optional()
      .describe('Filter by token (optional)'),
    maxRisk: z
      .number()
      .min(1)
      .max(3)
      .optional()
      .describe('Max risk: 1=Shallows, 2=Mid-Depth, 3=Deep Water'),
    limit: z.number().min(1).max(20).optional().describe('Number of results (default 5)'),
  }),
  execute: async (input) => {
    const { token, maxRisk = 2, limit = 5 } = input;

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

      const params = new URLSearchParams();
      if (token) params.set('token', token);
      params.set('maxRisk', maxRisk.toString());
      params.set('limit', limit.toString());
      params.set('chains', 'Solana');

      const response = await fetch(`${baseUrl}/api/yields?${params}`);
      if (!response.ok) throw new Error(`Yields API error: ${response.status}`);

      const data = await response.json();
      return {
        yields: data.opportunities || [],
        count: data.opportunities?.length || 0,
        note: `Found ${data.opportunities?.length || 0} Solana yield opportunities` +
          (token ? ` for ${token}` : '') + '.',
      };
    } catch (err) {
      return {
        error: true,
        message: `Yield scan failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

// --- Wallet Balance Tool ---

export const getWalletBalancesTool = tool({
  description:
    'Get all token balances for a Solana wallet. ' +
    'Returns SOL and SPL token balances. Use this to check what the user has before recommending strategies.',
  inputSchema: z.object({
    walletAddress: z.string().describe('Solana wallet address (base58)'),
  }),
  execute: async (input) => {
    try {
      const balances = await getWalletBalances(input.walletAddress);
      const formatted = Object.entries(balances)
        .map(([symbol, balance]) => `${symbol}: ${balance.toFixed(balance < 0.01 ? 6 : 2)}`)
        .join(', ');

      return {
        balances,
        formatted,
        note: `Wallet balances: ${formatted}`,
      };
    } catch (err) {
      return {
        error: true,
        message: `Balance check failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

// --- Export all Solana tools ---

export const solanaTidalTools = {
  swapToken: swapTokenTool,
  stakeSOL: stakeSOLTool,
  unstakeSOL: unstakeSOLTool,
  lendUSDC: lendUSDCTool,
  withdrawLend: withdrawLendTool,
  getSolanaRates: getSolanaRatesTool,
  compareYields: compareYieldsTool,
  scanSolanaYields: scanSolanaYieldsTool,
  getWalletBalances: getWalletBalancesTool,
};
