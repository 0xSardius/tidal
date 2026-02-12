'use client';

import { usePortfolio } from '@/lib/contexts/PortfolioContext';
import { useAccount } from 'wagmi';

export function AavePositions() {
  const { isConnected } = useAccount();
  const { aavePositions: positions, vaultPositions, totalValueUsd, isLoading, refetch } = usePortfolio();

  const hasAny = positions.length > 0 || vaultPositions.length > 0;

  if (!isConnected) {
    return (
      <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 text-center">
        <p className="text-sm text-slate-400">Connect wallet to view positions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          Your Positions
        </h3>
        <button
          onClick={() => refetch()}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>
      ) : !hasAny ? (
        <div className="p-6 bg-slate-800/30 rounded-lg border border-dashed border-slate-700 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-700/50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-400 mb-1">No active positions</p>
          <p className="text-xs text-slate-500">
            Chat with Tidal to start earning yield
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            {/* AAVE Positions */}
            {positions.map((position) => (
              <div
                key={`aave-${position.token}`}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      position.token === 'USDC'
                        ? 'bg-cyan-500/20'
                        : 'bg-purple-500/20'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        position.token === 'USDC'
                          ? 'text-cyan-400'
                          : 'text-purple-400'
                      }`}
                    >
                      {position.token === 'USDC' ? '$' : 'Ξ'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {position.suppliedFormatted} {position.token}
                    </p>
                    <p className="text-xs text-slate-500">
                      AAVE V3 · {position.currentApy.toFixed(2)}% APY
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Earning
                  </p>
                </div>
              </div>
            ))}
            {/* Vault Positions */}
            {vaultPositions.map((position) => (
              <div
                key={`vault-${position.vaultSlug}`}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      position.protocol === 'yo'
                        ? 'bg-emerald-500/20'
                        : 'bg-purple-500/20'
                    }`}
                  >
                    <span className="text-xs">
                      {position.protocol === 'yo' ? '🚀' : '🦋'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {parseFloat(position.assetsFormatted).toFixed(2)} {position.token}
                    </p>
                    <p className="text-xs text-slate-500">
                      {position.vaultName} · {position.apyEstimate.toFixed(1)}% APY
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Earning
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalValueUsd > 0 && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-lg border border-cyan-500/20">
              <span className="text-sm text-slate-400">Total Value</span>
              <span className="text-lg font-semibold text-white">
                ${totalValueUsd.toFixed(2)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
