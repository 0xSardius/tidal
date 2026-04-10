import { MINTS } from './constants';
import { getConnection, getTokenBalance } from './connection';
import { JUPITER_BASE_URL, JUPITER_API_KEY } from './constants';

// Kamino Lend Main Market
const KAMINO_MAIN_MARKET = '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';

// --- Types ---

export interface KaminoLendResult {
  action: 'lend';
  protocol: 'kamino';
  token: string;
  amount: string;
  estimatedApy: number;
  market: string;
  note: string;
  risks: string[];
}

export interface KaminoWithdrawResult {
  action: 'withdraw';
  protocol: 'kamino';
  token: string;
  amount: string;
  note: string;
}

export interface KaminoPosition {
  protocol: 'kamino';
  token: string;
  deposited: number;
  currentValue: number;
  apy: number;
  market: string;
}

export interface KaminoRate {
  token: string;
  supplyApy: number;
  borrowApy: number;
  totalSupply: number;
  totalBorrow: number;
  utilization: number;
}

// --- Rate Queries ---

/** Get Kamino lending rates from DeFi Llama. */
export async function getKaminoRates(token: string = 'USDC'): Promise<KaminoRate> {
  try {
    const res = await fetch('https://yields.llama.fi/pools');
    if (!res.ok) throw new Error(`DeFi Llama API error: ${res.status}`);

    const data = await res.json();
    const pool = data.data?.find(
      (p: { project: string; symbol: string; chain: string }) =>
        p.project === 'kamino-lend' &&
        p.chain === 'Solana' &&
        p.symbol?.toUpperCase().includes(token.toUpperCase()),
    );

    if (pool) {
      return {
        token,
        supplyApy: pool.apyBase ?? pool.apy ?? 0,
        borrowApy: pool.apyBaseBorrow ?? 0,
        totalSupply: pool.tvlUsd ?? 0,
        totalBorrow: pool.totalBorrowUsd ?? 0,
        utilization: pool.totalBorrowUsd && pool.tvlUsd
          ? (pool.totalBorrowUsd / pool.tvlUsd) * 100
          : 0,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch Kamino rates from DeFi Llama:', err);
  }

  // Fallback approximate rates
  return {
    token,
    supplyApy: token === 'USDC' ? 4.2 : 2.0,
    borrowApy: token === 'USDC' ? 6.5 : 4.0,
    totalSupply: 0,
    totalBorrow: 0,
    utilization: 0,
  };
}

// --- Lending Operations ---

/** Prepare a Kamino USDC lending deposit. */
export async function prepareLend(params: {
  wallet: string;
  token: string;
  amount: number;
}): Promise<KaminoLendResult> {
  const mint = params.token.toUpperCase() === 'USDC' ? MINTS.USDC : MINTS.USDT;
  const balance = await getTokenBalance(params.wallet, mint);

  if (params.amount > balance) {
    throw new Error(
      `Insufficient ${params.token}. You have ${balance.toFixed(2)} ${params.token}, ` +
      `tried to lend ${params.amount}.`,
    );
  }

  const rates = await getKaminoRates(params.token);

  return {
    action: 'lend',
    protocol: 'kamino',
    token: params.token.toUpperCase(),
    amount: params.amount.toString(),
    estimatedApy: rates.supplyApy,
    market: 'Main Market',
    note:
      `Lend ${params.amount} ${params.token} on Kamino (${rates.supplyApy.toFixed(2)}% APY). ` +
      `Kamino is audited by OtterSec and Kudelski with ~$3B TVL. ` +
      `You can withdraw anytime.`,
    risks: [
      'APY is variable and may decrease if utilization drops',
      'Smart contract risk (mitigated by audits and $3B TVL track record)',
      'Your deposit earns kTokens — yield-bearing receipt tokens',
    ],
  };
}

/** Prepare a Kamino withdrawal. */
export async function prepareWithdraw(params: {
  wallet: string;
  token: string;
  amount: number;
}): Promise<KaminoWithdrawResult> {
  return {
    action: 'withdraw',
    protocol: 'kamino',
    token: params.token.toUpperCase(),
    amount: params.amount.toString(),
    note:
      `Withdraw ${params.amount} ${params.token} from Kamino Lend. ` +
      `Funds return to your wallet immediately.`,
  };
}

// --- Jupiter Lend (for comparison) ---

export interface JupiterLendRate {
  token: string;
  supplyApy: number;
  totalDeposits: number;
}

/** Get Jupiter Lend rates from DeFi Llama. */
export async function getJupiterLendRates(token: string = 'USDC'): Promise<JupiterLendRate> {
  try {
    const res = await fetch('https://yields.llama.fi/pools');
    if (!res.ok) throw new Error(`DeFi Llama API error: ${res.status}`);

    const data = await res.json();
    const pool = data.data?.find(
      (p: { project: string; symbol: string; chain: string }) =>
        (p.project === 'jupiter-lend' || p.project === 'jupiter-earn') &&
        p.chain === 'Solana' &&
        p.symbol?.toUpperCase().includes(token.toUpperCase()),
    );

    if (pool) {
      return {
        token,
        supplyApy: pool.apyBase ?? pool.apy ?? 0,
        totalDeposits: pool.tvlUsd ?? 0,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch Jupiter Lend rates:', err);
  }

  return { token, supplyApy: 5.8, totalDeposits: 0 };
}

/** Prepare a Jupiter Lend deposit via their API. */
export async function prepareJupiterLend(params: {
  wallet: string;
  token: string;
  amount: number;
}): Promise<KaminoLendResult> {
  const mint = params.token.toUpperCase() === 'USDC' ? MINTS.USDC : MINTS.USDT;
  const balance = await getTokenBalance(params.wallet, mint);

  if (params.amount > balance) {
    throw new Error(
      `Insufficient ${params.token}. You have ${balance.toFixed(2)} ${params.token}, ` +
      `tried to lend ${params.amount}.`,
    );
  }

  const rates = await getJupiterLendRates(params.token);

  return {
    action: 'lend',
    protocol: 'kamino', // will be 'jupiter-lend' when we differentiate
    token: params.token.toUpperCase(),
    amount: params.amount.toString(),
    estimatedApy: rates.supplyApy,
    market: 'Jupiter Lend',
    note:
      `Lend ${params.amount} ${params.token} on Jupiter Lend (${rates.supplyApy.toFixed(2)}% APY). ` +
      `Jupiter Lend uses isolated vaults with 0.1% liquidation penalties (100x lower than industry). ` +
      `You can withdraw anytime.`,
    risks: [
      'APY is variable and depends on borrowing demand',
      'Jupiter Lend is newer than Kamino (launched Aug 2025)',
      'Isolated vault design limits contagion risk',
    ],
  };
}

/** Compare Kamino vs Jupiter Lend rates for a given token. */
export async function compareRates(token: string = 'USDC'): Promise<{
  kamino: KaminoRate;
  jupiterLend: JupiterLendRate;
  recommendation: 'kamino' | 'jupiter-lend';
  note: string;
}> {
  const [kamino, jupiterLend] = await Promise.all([
    getKaminoRates(token),
    getJupiterLendRates(token),
  ]);

  const recommendation = jupiterLend.supplyApy > kamino.supplyApy ? 'jupiter-lend' : 'kamino';
  const better = recommendation === 'kamino' ? kamino.supplyApy : jupiterLend.supplyApy;
  const worse = recommendation === 'kamino' ? jupiterLend.supplyApy : kamino.supplyApy;

  return {
    kamino,
    jupiterLend,
    recommendation,
    note:
      `${recommendation === 'kamino' ? 'Kamino' : 'Jupiter Lend'} is offering ` +
      `${better.toFixed(2)}% APY vs ${worse.toFixed(2)}% on ${recommendation === 'kamino' ? 'Jupiter Lend' : 'Kamino'}. ` +
      `Both are Shallows-safe for ${token}.`,
  };
}
