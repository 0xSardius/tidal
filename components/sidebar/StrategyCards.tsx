'use client';

import { useEffect, useState } from 'react';
import { useRiskDepth } from '@/lib/hooks/useRiskDepth';
import { getVaultsForRisk, type VaultEntry } from '@/lib/vault-registry';

// Sidebar card data - combines AAVE (from DeFi Llama) with vault registry entries
interface SidebarEntry {
  id: string;
  name: string;
  curator: string;
  token: string;
  apy: number | null;
  hasRewards: boolean;
  color: string;
  icon: string;
  type: 'aave' | 'vault';
  vaultSlug?: string;
}

// Visual styles per source
const STYLES = {
  aave: { color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20', icon: '🏛️' },
  morpho: { color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20', icon: '🦋' },
};

interface StrategyCardsProps {
  onStrategyClick?: (message: string) => void;
}

export function StrategyCards({ onStrategyClick }: StrategyCardsProps) {
  const { riskDepth } = useRiskDepth();
  const [entries, setEntries] = useState<SidebarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentDepth = riskDepth || 'shallows';

  useEffect(() => {
    async function buildSidebar() {
      try {
        // Determine which risk levels to show (exclusive per tier, no repeats)
        const tierRiskLevels: Record<string, number[]> = {
          'shallows': [1],
          'mid-depth': [2],
          'deep-water': [2, 3],
        };
        const showRisks = tierRiskLevels[currentDepth] || [1];
        const showAave = currentDepth === 'shallows'; // AAVE only in Shallows

        // Build vault entries from registry (filtered by tier)
        const allVaults = Object.entries(
          await import('@/lib/vault-registry').then(m => m.VAULT_REGISTRY)
        );
        const tierVaults = allVaults.filter(
          ([, v]) => showRisks.includes(v.riskLevel)
        );

        // Fetch AAVE APY from DeFi Llama (only needed for Shallows)
        let aaveApy: number | null = null;
        if (showAave) {
          try {
            const res = await fetch(`/api/aave/rates`);
            const data = await res.json();
            if (data.success && data.rates?.USDC?.apy) {
              aaveApy = data.rates.USDC.apy;
            }
          } catch {
            aaveApy = 3.5; // Fallback
          }
        }

        const result: SidebarEntry[] = [];

        // Add AAVE card for Shallows
        if (showAave) {
          result.push({
            id: 'aave-usdc',
            name: 'AAVE V3',
            curator: 'Aave DAO',
            token: 'USDC',
            apy: aaveApy,
            hasRewards: false,
            ...STYLES.aave,
            type: 'aave',
          });
        }

        // Add vault entries from registry with their estimated APYs
        for (const [slug, vault] of tierVaults) {
          const hasRewards = vault.description.toLowerCase().includes('reward') ||
                           vault.description.toLowerCase().includes('well') ||
                           vault.description.toLowerCase().includes('extra') ||
                           vault.description.toLowerCase().includes('seam');

          result.push({
            id: slug,
            name: vault.name,
            curator: vault.curator,
            token: vault.underlyingToken,
            apy: vault.apyEstimate,
            hasRewards,
            ...STYLES.morpho,
            type: 'vault',
            vaultSlug: slug,
          });
        }

        // Sort: AAVE first, then vaults by APY (highest first)
        result.sort((a, b) => {
          if (a.type === 'aave') return -1;
          if (b.type === 'aave') return 1;
          return (b.apy || 0) - (a.apy || 0);
        });

        setEntries(result);
      } catch (err) {
        console.error('Failed to build sidebar:', err);
      } finally {
        setIsLoading(false);
      }
    }
    buildSidebar();
  }, [currentDepth]);

  const handleClick = (entry: SidebarEntry) => {
    if (onStrategyClick) {
      if (entry.type === 'aave') {
        onStrategyClick(`I'd like to earn yield on USDC with AAVE. What's the current rate?`);
      } else {
        onStrategyClick(`I'd like to deposit into the ${entry.name} vault. Tell me about it.`);
      }
    }
  };

  const tierLabel = currentDepth === 'shallows' ? 'Safe Harbors' :
                    currentDepth === 'mid-depth' ? 'Growth Currents' : 'Deep Opportunities';

  return (
    <div className="px-3 pb-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{tierLabel}</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>
      ) : entries.length === 0 ? (
        <div className="p-3 rounded-lg border border-dashed border-slate-700 text-center">
          <p className="text-xs text-slate-500">No strategies for this tier</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => {
            return (
              <button
                key={entry.id}
                onClick={() => handleClick(entry)}
                className={`w-full text-left p-2.5 rounded-lg bg-gradient-to-r ${entry.color} border transition-all hover:brightness-125 hover:scale-[1.02] active:scale-[0.98] group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm flex-shrink-0">{entry.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                        {entry.name}
                        {entry.hasRewards && (
                          <span className="text-[8px] px-1 py-px rounded bg-emerald-500/20 text-emerald-400 font-medium">
                            + Rewards
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {entry.token} · {entry.curator}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    {entry.apy !== null ? (
                      <>
                        <div className="text-sm font-semibold tabular-nums text-slate-300">
                          {entry.apy.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-500">APY</div>
                      </>
                    ) : (
                      <div className="text-[10px] text-slate-500">Ask Tidal</div>
                    )}
                  </div>
                </div>
                <div className="mt-1.5">
                  <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Dive in with Tidal →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Tier unlock hint */}
      {currentDepth === 'shallows' && !isLoading && (
        <div className="mt-2 p-2 rounded-lg bg-teal-500/5 border border-teal-500/10">
          <p className="text-[10px] text-teal-400/70 text-center">
            Unlock higher yields at Mid-Depth
          </p>
        </div>
      )}

      <div className="mt-1.5 text-center">
        <span className="text-[9px] text-slate-600">Live rates · Powered by Morpho & AAVE</span>
      </div>
    </div>
  );
}
