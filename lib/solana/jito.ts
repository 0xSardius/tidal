import { PublicKey } from '@solana/web3.js';
import { MINTS } from './constants';
import { getConnection, getTokenBalance, getSolBalance } from './connection';

// Jito Stake Pool addresses
const JITO_STAKE_POOL = new PublicKey('Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb');
const JITO_SOL_MINT = MINTS.JITOSOL;

// Jito API for staking operations
const JITO_API_BASE = 'https://api.jito.network';

// --- Types ---

export interface JitoStakeResult {
  action: 'stake';
  protocol: 'jito';
  inputToken: 'SOL';
  outputToken: 'JitoSOL';
  inputAmount: string;
  estimatedOutput: string;
  exchangeRate: number;
  apy: number;
  note: string;
  risks: string[];
}

export interface JitoUnstakeResult {
  action: 'unstake';
  protocol: 'jito';
  inputToken: 'JitoSOL';
  outputToken: 'SOL';
  inputAmount: string;
  estimatedOutput: string;
  exchangeRate: number;
  note: string;
}

export interface JitoPosition {
  jitoSolBalance: number;
  solValue: number;
  exchangeRate: number;
  apy: number;
}

// --- Rate & Position Queries ---

/** Get the current JitoSOL/SOL exchange rate and APY. */
export async function getJitoRate(): Promise<{ exchangeRate: number; apy: number }> {
  // Fetch from Jito's public stats endpoint
  try {
    const res = await fetch('https://www.jito.network/api/get-stats', {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        exchangeRate: data.exchange_rate ?? 1.0,
        apy: data.apy ?? 5.9,
      };
    }
  } catch {
    // fallback below
  }

  // Fallback: fetch from DeFi Llama or use approximate values
  try {
    const res = await fetch('https://yields.llama.fi/pools');
    if (res.ok) {
      const data = await res.json();
      const jitoPool = data.data?.find(
        (p: { project: string; symbol: string }) =>
          p.project === 'jito' && p.symbol?.toLowerCase().includes('jitosol'),
      );
      if (jitoPool) {
        return {
          exchangeRate: 1.0, // DeFi Llama doesn't provide this directly
          apy: jitoPool.apy ?? 5.9,
        };
      }
    }
  } catch {
    // use defaults
  }

  return { exchangeRate: 1.0, apy: 5.9 };
}

/** Get a user's JitoSOL position. */
export async function getJitoPosition(wallet: string): Promise<JitoPosition | null> {
  const balance = await getTokenBalance(wallet, JITO_SOL_MINT);
  if (balance === 0) return null;

  const { exchangeRate, apy } = await getJitoRate();

  return {
    jitoSolBalance: balance,
    solValue: balance * exchangeRate,
    exchangeRate,
    apy,
  };
}

// --- Staking Operations ---

/**
 * Prepare a JitoSOL staking operation.
 * Uses Jupiter Ultra to swap SOL → JitoSOL (best route, handles everything).
 */
export async function prepareStake(params: {
  wallet: string;
  amountSol: number;
}): Promise<JitoStakeResult> {
  const { exchangeRate, apy } = await getJitoRate();
  const solBalance = await getSolBalance(params.wallet);

  if (params.amountSol > solBalance - 0.01) {
    throw new Error(
      `Insufficient SOL. You have ${solBalance.toFixed(4)} SOL, ` +
      `need ${params.amountSol} SOL plus ~0.01 SOL for fees.`,
    );
  }

  const estimatedJitoSol = params.amountSol / exchangeRate;

  return {
    action: 'stake',
    protocol: 'jito',
    inputToken: 'SOL',
    outputToken: 'JitoSOL',
    inputAmount: params.amountSol.toString(),
    estimatedOutput: estimatedJitoSol.toFixed(6),
    exchangeRate,
    apy,
    note:
      `Stake ${params.amountSol} SOL → ~${estimatedJitoSol.toFixed(4)} JitoSOL ` +
      `(${apy.toFixed(1)}% APY). JitoSOL earns staking rewards + MEV tips. ` +
      `You can unstake anytime.`,
    risks: [
      'JitoSOL price may briefly diverge from SOL during market stress',
      'Unstaking may take 1-2 epochs (~4 days) via direct unstake, or instant via Jupiter swap',
    ],
  };
}

/** Prepare a JitoSOL unstake (JitoSOL → SOL via Jupiter swap for instant liquidity). */
export async function prepareUnstake(params: {
  wallet: string;
  amountJitoSol: number;
}): Promise<JitoUnstakeResult> {
  const balance = await getTokenBalance(params.wallet, JITO_SOL_MINT);

  if (params.amountJitoSol > balance) {
    throw new Error(
      `Insufficient JitoSOL. You have ${balance.toFixed(4)} JitoSOL, ` +
      `tried to unstake ${params.amountJitoSol}.`,
    );
  }

  const { exchangeRate } = await getJitoRate();
  const estimatedSol = params.amountJitoSol * exchangeRate;

  return {
    action: 'unstake',
    protocol: 'jito',
    inputToken: 'JitoSOL',
    outputToken: 'SOL',
    inputAmount: params.amountJitoSol.toString(),
    estimatedOutput: estimatedSol.toFixed(6),
    exchangeRate,
    note:
      `Unstake ${params.amountJitoSol} JitoSOL → ~${estimatedSol.toFixed(4)} SOL ` +
      `via Jupiter swap (instant). Exchange rate: 1 JitoSOL = ${exchangeRate.toFixed(6)} SOL.`,
  };
}
