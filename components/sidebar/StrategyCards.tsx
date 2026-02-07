'use client';

import { useEffect, useState } from 'react';
import { useRiskDepth } from '@/lib/hooks/useRiskDepth';

// Sidebar card data
interface SidebarEntry {
  id: string;
  name: string;
  subtitle: string;
  token: string;
  apy: number | null;
  badge?: 'rewards' | 'scouted';
  color: string;
  icon: string;
  type: 'aave' | 'vault' | 'discovery';
  vaultSlug?: string;
  protocol?: string;
}

// Visual styles
const STYLES = {
  aave: { color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20', icon: '🏛️' },
  morpho: { color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20', icon: '🦋' },
  yo: { color: 'from-emerald-500/20 to-green-600/10 border-emerald-500/20', icon: '🚀' },
  discovery: { color: 'from-amber-500/10 to-orange-500/5 border-amber-500/15', icon: '🔭' },
};

// Protocol display names for discovery items
const PROTOCOL_NAMES: Record<string, { name: string; icon: string }> = {
  'aerodrome-v2': { name: 'Aerodrome', icon: '✈️' },
  'aerodrome-v1': { name: 'Aerodrome', icon: '✈️' },
  'moonwell-lending': { name: 'Moonwell', icon: '🌙' },
  'compound-v3': { name: 'Compound', icon: '🌿' },
  'gains-network': { name: 'Gains Network', icon: '📈' },
  'avantis': { name: 'Avantis', icon: '⚡' },
  'extra-finance': { name: 'Extra Finance', icon: '💎' },
  'seamless-protocol': { name: 'Seamless', icon: '🌊' },
};

// Protocols we already have adapters for (don't show as discovery)
const EXECUTABLE_PROTOCOLS = ['aave-v3', 'morpho-v1', 'yo'];

interface DeFiLlamaOpp {
  id: string;
  protocol: string;
  symbol: string;
  apy: number;
  apyReward: number | null;
  tvlUsd: number;
  riskLevel: number;
}

interface StrategyCardsProps {
  onStrategyClick?: (message: string) => void;
}

export function StrategyCards({ onStrategyClick }: StrategyCardsProps) {
  const { riskDepth, isLoaded } = useRiskDepth();
  const [entries, setEntries] = useState<SidebarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentDepth = riskDepth || 'shallows';

  useEffect(() => {
    // Wait until riskDepth is loaded from localStorage to avoid
    // firing with the wrong depth and then re-firing
    if (!isLoaded) return;

    // Reset loading state when depth changes
    setIsLoading(true);
    setEntries([]);

    async function buildSidebar() {
      try {
        const result: SidebarEntry[] = [];

        if (currentDepth === 'shallows') {
          // === SHALLOWS: AAVE + conservative Morpho vaults ===
          let aaveApy: number | null = null;
          try {
            const res = await fetch(`/api/aave/rates`);
            const data = await res.json();
            if (data.success && data.rates?.USDC?.apy) {
              aaveApy = data.rates.USDC.apy;
            }
          } catch {
            aaveApy = 3.5;
          }

          result.push({
            id: 'aave-usdc',
            name: 'AAVE V3',
            subtitle: 'Aave DAO · USDC',
            token: 'USDC',
            apy: aaveApy,
            ...STYLES.aave,
            type: 'aave',
          });

          // Add Shallows vaults from registry
          const { VAULT_REGISTRY } = await import('@/lib/vault-registry');
          for (const [slug, vault] of Object.entries(VAULT_REGISTRY)) {
            if (vault.riskLevel === 1) {
              const style = vault.protocol === 'yo' ? STYLES.yo : STYLES.morpho;
              result.push({
                id: slug,
                name: vault.name,
                subtitle: `${vault.curator} · ${vault.underlyingToken}`,
                token: vault.underlyingToken,
                apy: vault.apyEstimate,
                ...style,
                type: 'vault',
                vaultSlug: slug,
              });
            }
          }
        } else {
          // === MID-DEPTH / DEEP WATER: Executable vaults + discovery ===
          const maxRisk = currentDepth === 'mid-depth' ? 2 : 3;

          // Add Mid-Depth+ vaults from registry
          const { VAULT_REGISTRY } = await import('@/lib/vault-registry');
          for (const [slug, vault] of Object.entries(VAULT_REGISTRY)) {
            if (vault.riskLevel === 2) {
              const hasRewards = vault.description.toLowerCase().includes('reward') ||
                               vault.description.toLowerCase().includes('well') ||
                               vault.description.toLowerCase().includes('extra') ||
                               vault.description.toLowerCase().includes('seam');
              const style = vault.protocol === 'yo' ? STYLES.yo : STYLES.morpho;

              result.push({
                id: slug,
                name: vault.name,
                subtitle: `${vault.curator} · ${vault.underlyingToken}`,
                token: vault.underlyingToken,
                apy: vault.apyEstimate,
                badge: hasRewards ? 'rewards' : undefined,
                ...style,
                type: 'vault',
                vaultSlug: slug,
              });
            }
          }

          // Fetch high-yield discovery items from DeFi Llama
          // Use maxRisk=3 for discovery since these are informational only (not executable)
          try {
            const res = await fetch(`/api/yields?maxRisk=3&limit=50`);
            const data = await res.json();
            if (data.success && data.opportunities) {
              // Get non-executable protocols with meaningful APY
              const discoveries = (data.opportunities as DeFiLlamaOpp[])
                .filter(o =>
                  !EXECUTABLE_PROTOCOLS.includes(o.protocol) &&
                  o.apy >= 3 &&
                  o.tvlUsd >= 100_000
                );

              // Deduplicate by protocol, keep highest APY
              const byProtocol = new Map<string, DeFiLlamaOpp>();
              for (const opp of discoveries) {
                const existing = byProtocol.get(opp.protocol);
                if (!existing || opp.apy > existing.apy) {
                  byProtocol.set(opp.protocol, opp);
                }
              }

              // Take top 4 discovery protocols
              const topDiscoveries = Array.from(byProtocol.values())
                .sort((a, b) => b.apy - a.apy)
                .slice(0, 4);

              for (const opp of topDiscoveries) {
                const meta = PROTOCOL_NAMES[opp.protocol];
                result.push({
                  id: opp.id,
                  name: meta?.name || opp.protocol.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                  subtitle: `${opp.symbol} · Scouted by Tidal`,
                  token: opp.symbol,
                  apy: opp.apy,
                  badge: 'scouted',
                  color: STYLES.discovery.color,
                  icon: meta?.icon || '🔭',
                  type: 'discovery',
                  protocol: opp.protocol,
                });
              }
            }
          } catch {
            // Discovery items are optional
          }
        }

        // Sort: vaults first by APY desc, then discovery by APY desc
        result.sort((a, b) => {
          if (a.type === 'aave') return -1;
          if (b.type === 'aave') return 1;
          // Executable vaults above discovery
          if (a.type === 'vault' && b.type === 'discovery') return -1;
          if (a.type === 'discovery' && b.type === 'vault') return 1;
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
  }, [currentDepth, isLoaded]);

  const handleClick = (entry: SidebarEntry) => {
    if (onStrategyClick) {
      if (entry.type === 'aave') {
        onStrategyClick(`I'd like to earn yield on USDC with AAVE. What's the current rate?`);
      } else if (entry.type === 'vault') {
        onStrategyClick(`I'd like to deposit into the ${entry.name} vault. Tell me about it.`);
      } else {
        onStrategyClick(`Tell me about the ${entry.token} yield on ${entry.name} at ${entry.apy?.toFixed(1)}% APY. What are the risks?`);
      }
    }
  };

  // Split entries
  const executableEntries = entries.filter(e => e.type !== 'discovery');
  const discoveryEntries = entries.filter(e => e.type === 'discovery');

  // For Mid-Depth+: limit executable vaults to top 3
  const showExecutable = currentDepth === 'shallows'
    ? executableEntries
    : executableEntries.slice(0, 3);

  const isGrowthTier = currentDepth !== 'shallows';

  return (
    <div className="px-3 pb-2">
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
        <>
          {/* === SCOUTED FIRST for Mid-Depth+ (the hook) === */}
          {isGrowthTier && discoveryEntries.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider">Scouted by Tidal</span>
                <div className="flex-1 h-px bg-amber-500/10" />
              </div>
              <div className="space-y-1">
                {discoveryEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleClick(entry)}
                    className="w-full text-left px-2.5 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/15 transition-all hover:brightness-125 hover:scale-[1.01] active:scale-[0.99] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm flex-shrink-0">{entry.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-200 truncate">
                            {entry.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {entry.token}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-sm font-bold tabular-nums text-emerald-400">
                          {entry.apy?.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-500">APY</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-amber-500/40 text-center mt-1 mb-2">
                Click to ask Tidal about risks & strategy
              </p>
            </>
          )}

          {/* === EXECUTABLE VAULTS === */}
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {isGrowthTier ? 'Ready to Deposit' : 'Safe Harbors'}
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="space-y-1">
            {showExecutable.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleClick(entry)}
                className={`w-full text-left px-2.5 py-2 rounded-lg bg-gradient-to-r ${entry.color} border transition-all hover:brightness-125 hover:scale-[1.01] active:scale-[0.99] group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm flex-shrink-0">{entry.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                        {entry.name}
                        {entry.badge === 'rewards' && (
                          <span className="text-[8px] px-1 py-px rounded bg-emerald-500/20 text-emerald-400 font-medium">
                            + Rewards
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {entry.subtitle}
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
              </button>
            ))}
            {isGrowthTier && executableEntries.length > 3 && (
              <p className="text-[9px] text-slate-600 text-center pt-0.5">
                +{executableEntries.length - 3} more vaults · Ask Tidal
              </p>
            )}
          </div>
        </>
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
        <span className="text-[9px] text-slate-600">Live rates · Powered by DeFi Llama</span>
      </div>
    </div>
  );
}
