'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

interface Transaction {
  id: string;
  wallet: string;
  type: string;
  protocol: string | null;
  token: string | null;
  amount: string | null;
  txHash: string | null;
  chain: string;
  status: string;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  swap: '\u21C4',
  supply: '\u2B06',
  withdraw: '\u2B07',
  vault_deposit: '\u{1F4E5}',
  vault_withdraw: '\u{1F4E4}',
  swap_and_supply: '\u26A1',
};

const TYPE_LABELS: Record<string, string> = {
  swap: 'Swap',
  supply: 'AAVE Supply',
  withdraw: 'AAVE Withdraw',
  vault_deposit: 'Vault Deposit',
  vault_withdraw: 'Vault Withdraw',
  swap_and_supply: 'Swap & Supply',
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of txs) {
    const date = new Date(tx.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
  }
  return groups;
}

const PAGE_SIZE = 20;

export function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchTransactions = useCallback(
    async (currentOffset: number, append: boolean) => {
      if (!address) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/transactions?wallet=${address}&limit=${PAGE_SIZE}&offset=${currentOffset}`
        );
        const data = await res.json();
        if (data.success) {
          const newTxs = data.transactions as Transaction[];
          setTransactions((prev) => (append ? [...prev, ...newTxs] : newTxs));
          setHasMore(newTxs.length === PAGE_SIZE);
        }
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  useEffect(() => {
    if (address) {
      setOffset(0);
      fetchTransactions(0, false);
    }
  }, [address, fetchTransactions]);

  const loadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchTransactions(newOffset, true);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-slate-500">
        <svg className="w-12 h-12 mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-sm">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  const grouped = groupByDate(transactions);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/5">
        <h2 className="font-semibold text-slate-200">Transaction Log</h2>
        <p className="text-xs text-slate-500 mt-0.5">Your on-chain activity history</p>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
        {loading && transactions.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <svg className="w-12 h-12 mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs text-slate-600 mt-1">Transactions will appear here after your first action</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">
                {date}
              </div>
              <div className="space-y-2">
                {txs.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      tx.status === 'failed'
                        ? 'bg-red-500/5 border-red-500/15'
                        : 'bg-white/5 border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center">
                          {TYPE_ICONS[tx.type] || '\u2022'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-200">
                              {TYPE_LABELS[tx.type] || tx.type}
                            </span>
                            {tx.protocol && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                                {tx.protocol}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {tx.token && <span>{tx.amount ? `${tx.amount} ` : ''}{tx.token}</span>}
                            {!tx.token && tx.amount && <span>{tx.amount}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">{relativeTime(tx.createdAt)}</div>
                        {tx.status === 'failed' ? (
                          <span className="text-[10px] text-red-400">Failed</span>
                        ) : tx.txHash ? (
                          <a
                            href={`https://basescan.org/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            View on BaseScan ↗
                          </a>
                        ) : null}
                      </div>
                    </div>
                    {tx.status === 'failed' && tx.errorMessage && (
                      <div className="mt-2 text-xs text-red-400/80 pl-10">
                        {tx.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {hasMore && (
          <div className="flex justify-center py-4">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
