import { PublicKey } from '@solana/web3.js';

// RPC Endpoints (mainnet)
export const SOLANA_RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.g.alchemy.com/v2/demo',
] as const;

// Jupiter API
export const JUPITER_BASE_URL = 'https://api.jup.ag';
export const JUPITER_API_KEY = process.env.JUPITER_API_KEY || '';

// Program IDs
export const PROGRAMS = {
  JITO_STAKE_POOL: new PublicKey('Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'),
  KAMINO_MAIN_MARKET: new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'),
  JUPITER_LEND_EARN: new PublicKey('jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9'),
} as const;

// Token Mints (Solana mainnet)
export const MINTS = {
  SOL: new PublicKey('So11111111111111111111111111111111111111112'),
  USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
  JITOSOL: new PublicKey('J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn'),
  MSOL: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
  BSOL: new PublicKey('bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1'),
  INF: new PublicKey('5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'),
} as const;

export type SolanaMint = keyof typeof MINTS;

// Token metadata for display
export const SOLANA_TOKENS: Record<string, {
  mint: PublicKey;
  symbol: string;
  decimals: number;
  name: string;
  coingeckoId?: string;
}> = {
  SOL: { mint: MINTS.SOL, symbol: 'SOL', decimals: 9, name: 'Solana', coingeckoId: 'solana' },
  USDC: { mint: MINTS.USDC, symbol: 'USDC', decimals: 6, name: 'USD Coin', coingeckoId: 'usd-coin' },
  USDT: { mint: MINTS.USDT, symbol: 'USDT', decimals: 6, name: 'Tether USD', coingeckoId: 'tether' },
  JITOSOL: { mint: MINTS.JITOSOL, symbol: 'JitoSOL', decimals: 9, name: 'Jito Staked SOL', coingeckoId: 'jito-staked-sol' },
  MSOL: { mint: MINTS.MSOL, symbol: 'mSOL', decimals: 9, name: 'Marinade Staked SOL', coingeckoId: 'msol' },
  INF: { mint: MINTS.INF, symbol: 'INF', decimals: 9, name: 'Sanctum Infinity', coingeckoId: 'sanctum-infinity' },
};

// Resolve mint from symbol or address
export function resolveMint(tokenOrMint: string): PublicKey {
  const upper = tokenOrMint.toUpperCase();
  if (upper in MINTS) return MINTS[upper as SolanaMint];
  return new PublicKey(tokenOrMint);
}

// Resolve token symbol from mint address
export function resolveSymbol(mint: PublicKey | string): string {
  const mintStr = typeof mint === 'string' ? mint : mint.toBase58();
  for (const [symbol, info] of Object.entries(SOLANA_TOKENS)) {
    if (info.mint.toBase58() === mintStr) return symbol;
  }
  return mintStr.slice(0, 6) + '...';
}

// Resolve decimals from mint
export function resolveDecimals(mint: PublicKey | string): number {
  const mintStr = typeof mint === 'string' ? mint : mint.toBase58();
  for (const info of Object.values(SOLANA_TOKENS)) {
    if (info.mint.toBase58() === mintStr) return info.decimals;
  }
  return 9; // default to SOL decimals
}
