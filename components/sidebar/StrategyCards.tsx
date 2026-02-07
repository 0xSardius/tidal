'use client';

import { useEffect, useState } from 'react';
import { useRiskDepth } from '@/lib/hooks/useRiskDepth';

interface YieldOpportunity {
  id: string;
  protocol: string;
  symbol: string;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  tvlUsd: number;
  riskLevel: number;
}

// Friendly protocol names and icons
const PROTOCOL_META: Record<string, { name: string; color: string; icon: string }> = {
  'aave-v3': { name: 'AAVE V3', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20', icon: '🏛️' },
  'morpho-v1': { name: 'Morpho', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20', icon: '🦋' },
  'compound-v3': { name: 'Compound', color: 'from-green-500/20 to-green-600/10 border-green-500/20', icon: '🌿' },
  'moonwell-lending': { name: 'Moonwell', color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20', icon: '🌙' },
  'gains-network': { name: 'Gains', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20', icon: '📈' },
  'avantis': { name: 'Avantis', color: 'from-teal-500/20 to-teal-600/10 border-teal-500/20', icon: '⚡' },
};

// Protocols we can actually execute on - ONLY show these in the sidebar
const EXECUTABLE_PROTOCOLS = ['aave-v3', 'morpho-v1'];

function getProtocolMeta(protocol: string) {
  return PROTOCOL_META[protocol] || {
    name: protocol.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    color: 'from-slate-500/20 to-slate-600/10 border-slate-500/20',
    icon: '🌊',
  };
}

function formatTvl(tvl: number): string {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
  return `$${(tvl / 1_000).toFixed(0)}K`;
}

interface StrategyCardsProps {
  onStrategyClick?: (message: string) => void;
}

export function StrategyCards({ onStrategyClick }: StrategyCardsProps) {
  const { riskDepth } = useRiskDepth();
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentDepth = riskDepth || 'shallows';
  const maxRisk = currentDepth === 'shallows' ? 1 : currentDepth === 'mid-depth' ? 2 : 3;

  useEffect(() => {
    async function fetchYields() {
      try {
        const res = await fetch(`/api/yields?maxRisk=${maxRisk}&limit=30`);
        const data = await res.json();
        if (data.success && data.opportunities) {
          // Only show protocols we can actually execute on
          const executable = data.opportunities.filter(
            (opp: YieldOpportunity) => EXECUTABLE_PROTOCOLS.includes(opp.protocol)
          );

          // For AAVE: deduplicate to best rate (it has multiple pool entries)
          // For Morpho: keep individual entries (they represent different vaults)
          const aaveBest = executable
            .filter((o: YieldOpportunity) => o.protocol === 'aave-v3')
            .sort((a: YieldOpportunity, b: YieldOpportunity) => b.apy - a.apy)[0];
          const morphoVaults = executable
            .filter((o: YieldOpportunity) => o.protocol === 'morpho-v1')
            .sort((a: YieldOpportunity, b: YieldOpportunity) => b.apy - a.apy);

          // AAVE first, then Morpho vaults sorted by APY
          const combined: YieldOpportunity[] = [];
          if (aaveBest) combined.push(aaveBest);
          combined.push(...morphoVaults);

          setOpportunities(combined);
        }
      } catch (err) {
        console.error('Failed to fetch yields:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchYields();
  }, [maxRisk]);

  const handleClick = (opp: YieldOpportunity) => {
    const meta = getProtocolMeta(opp.protocol);
    if (onStrategyClick) {
      if (opp.protocol === 'aave-v3') {
        onStrategyClick(`I'd like to earn yield on USDC with ${meta.name}. What's the current rate?`);
      } else {
        // For Morpho vaults, mention the specific pool
        onStrategyClick(`I'd like to deposit into a ${meta.name} vault for ${opp.symbol}. What are my options?`);
      }
    }
  };

  // Limit display: Shallows=3, Mid-Depth=6, Deep Water=8
  const displayLimit = currentDepth === 'shallows' ? 3 : currentDepth === 'mid-depth' ? 6 : 8;
  const displayed = opportunities.slice(0, displayLimit);

  return (
    <div className="px-3 pb-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Yield Opportunities</span>
        {!isLoading && opportunities.length > displayLimit && (
          <span className="text-[10px] text-slate-600">+{opportunities.length - displayLimit} more</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="p-3 rounded-lg border border-dashed border-slate-700 text-center">
          <p className="text-xs text-slate-500">No yields found</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayed.map((opp, index) => {
            const meta = getProtocolMeta(opp.protocol);
            const hasRewards = opp.apyReward && opp.apyReward > 0;
            // Highest APY among displayed gets "Best Rate" badge
            const isBestRate = index > 0 && opp.apy === Math.max(...displayed.map(o => o.apy));
            return (
              <button
                key={opp.id}
                onClick={() => handleClick(opp)}
                className={`w-full text-left p-2.5 rounded-lg bg-gradient-to-r ${meta.color} border transition-all hover:brightness-125 hover:scale-[1.02] active:scale-[0.98] group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm flex-shrink-0">{meta.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                        {meta.name}
                        {hasRewards && (
                          <span className="text-[8px] px-1 py-px rounded bg-emerald-500/20 text-emerald-400 font-medium">
                            + Rewards
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {opp.symbol} · {formatTvl(opp.tvlUsd)} TVL
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-sm font-semibold tabular-nums ${isBestRate ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {opp.apy.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500">APY</div>
                  </div>
                </div>
                {isBestRate && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                      Best Rate
                    </span>
                    <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ask Tidal about this →
                    </span>
                  </div>
                )}
                {!isBestRate && (
                  <div className="mt-1.5">
                    <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Dive in with Tidal →
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tier unlock hint */}
      {currentDepth === 'shallows' && !isLoading && (
        <div className="mt-2 p-2 rounded-lg bg-teal-500/5 border border-teal-500/10">
          <p className="text-[10px] text-teal-400/70 text-center">
            Unlock more strategies at Mid-Depth
          </p>
        </div>
      )}

      <div className="mt-1.5 text-center">
        <span className="text-[9px] text-slate-600">Live rates via DeFi Llama</span>
      </div>
    </div>
  );
}
