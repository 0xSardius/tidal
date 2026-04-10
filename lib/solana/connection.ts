import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SOLANA_RPC_ENDPOINTS, SOLANA_TOKENS, resolveDecimals } from './constants';

let _connection: Connection | null = null;

/** Get a shared Solana RPC connection (lazy singleton). */
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(SOLANA_RPC_ENDPOINTS[0], {
      commitment: 'confirmed',
    });
  }
  return _connection;
}

/** Get SOL balance in SOL (not lamports). */
export async function getSolBalance(wallet: PublicKey | string): Promise<number> {
  const conn = getConnection();
  const pubkey = typeof wallet === 'string' ? new PublicKey(wallet) : wallet;
  const lamports = await conn.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}

/** Get SPL token balance for a given mint. Returns UI amount (human-readable). */
export async function getTokenBalance(
  wallet: PublicKey | string,
  mint: PublicKey | string,
): Promise<number> {
  const conn = getConnection();
  const walletPubkey = typeof wallet === 'string' ? new PublicKey(wallet) : wallet;
  const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;

  const accounts = await conn.getParsedTokenAccountsByOwner(walletPubkey, {
    mint: mintPubkey,
  });

  if (accounts.value.length === 0) return 0;

  return accounts.value.reduce((sum, acc) => {
    const amount = acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    return sum + amount;
  }, 0);
}

/** Get all token balances for a wallet. Returns object keyed by symbol. */
export async function getWalletBalances(
  wallet: PublicKey | string,
): Promise<Record<string, number>> {
  const pubkey = typeof wallet === 'string' ? new PublicKey(wallet) : wallet;

  const [solBalance, ...tokenBalances] = await Promise.all([
    getSolBalance(pubkey),
    ...Object.entries(SOLANA_TOKENS)
      .filter(([symbol]) => symbol !== 'SOL')
      .map(async ([symbol, info]) => ({
        symbol,
        balance: await getTokenBalance(pubkey, info.mint),
      })),
  ]);

  const balances: Record<string, number> = { SOL: solBalance };
  for (const { symbol, balance } of tokenBalances) {
    if (balance > 0) balances[symbol] = balance;
  }
  return balances;
}

/** Convert a human-readable amount to the smallest unit (lamports / token units). */
export function toBaseUnits(amount: number, mint: PublicKey | string): bigint {
  const decimals = resolveDecimals(mint);
  return BigInt(Math.floor(amount * 10 ** decimals));
}

/** Convert base units to human-readable amount. */
export function fromBaseUnits(amount: bigint | number, mint: PublicKey | string): number {
  const decimals = resolveDecimals(mint);
  return Number(amount) / 10 ** decimals;
}
