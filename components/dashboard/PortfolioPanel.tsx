'use client';

import { YieldRates } from './YieldRates';
import { AavePositions } from './AavePositions';
import { useAavePositions } from '@/lib/hooks/useAave';
import { useAccount } from 'wagmi';

export function PortfolioPanel() {
  const { isConnected } = useAccount();
  const { positions, totalValueUsd, isLoading } = useAavePositions();

  // Calculate stats from real positions
  const avgApy = positions.length > 0
    ? positions.reduce((sum, p) => sum + p.currentApy, 0) / positions.length
    : 0;
  const dailyYield = totalValueUsd > 0 ? (totalValueUsd * avgApy) / 100 / 365 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Your Pool
        </div>
      </div>

      {/* Total Value */}
      <div className="p-4 border-b border-white/5">
        <div className="text-xs text-slate-500 mb-1">Total Value</div>
        {isLoading ? (
          <div className="h-9 w-32 bg-slate-800 rounded animate-pulse" />
        ) : (
          <div className="text-3xl font-bold tracking-tight text-slate-100">
            ${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        )}
        {positions.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +${dailyYield.toFixed(4)}/day
            </span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-400">{avgApy.toFixed(2)}% APY</span>
          </div>
        )}
      </div>

      {/* Allocation Visual - Only show if positions exist */}
      {positions.length > 0 && (
        <div className="p-4 border-b border-white/5">
          <div className="text-xs text-slate-500 mb-3">Allocation</div>
          <div className="h-3 rounded-full overflow-hidden bg-white/5 flex">
            {positions.map((position, i) => {
              const width = totalValueUsd > 0
                ? (Number(position.suppliedFormatted) / totalValueUsd) * 100
                : 100 / positions.length;
              const colors = ['bg-cyan-500', 'bg-purple-500', 'bg-teal-500'];
              return (
                <div
                  key={position.token}
                  className={`${colors[i % colors.length]} transition-all duration-500`}
                  style={{ width: `${width}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs">
            {positions.map((position, i) => {
              const colors = ['text-cyan-400', 'text-purple-400', 'text-teal-400'];
              return (
                <span key={position.token} className={`flex items-center gap-1 ${colors[i % colors.length]}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {position.token}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* AAVE Positions */}
        <div className="p-4 border-b border-white/5">
          <AavePositions />
        </div>

        {/* Live Rates */}
        <div className="p-4">
          <YieldRates />
        </div>
      </div>

      {/* Ocean Conditions Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="text-xs text-slate-500 mb-2">Ocean Conditions</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-slate-500">Network</div>
            <div className="text-slate-300 font-mono">Base</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-slate-500">Status</div>
            <div className={`font-mono flex items-center gap-1 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
