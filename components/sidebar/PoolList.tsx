'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAavePositions } from '@/lib/hooks/useAave';
import { useRiskDepth } from '@/lib/hooks/useRiskDepth';

const depthColors = {
  'shallows': 'bg-cyan-500/20 text-cyan-300',
  'mid-depth': 'bg-teal-500/20 text-teal-300',
  'deep-water': 'bg-blue-600/20 text-blue-300',
};

const depthLabels = {
  'shallows': { name: 'Calm Waters', emoji: '🏖️' },
  'mid-depth': { name: 'Growth Current', emoji: '🌊' },
  'deep-water': { name: 'Deep Dive', emoji: '🐋' },
};

// Dynamically import wallet section to avoid SSR hydration issues
const WalletSection = dynamic(() => import('./WalletSection').then(mod => mod.WalletSection), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-3 px-2 py-2">
      <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
      <div className="flex-1">
        <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
        <div className="h-3 w-16 bg-slate-800 rounded mt-1 animate-pulse" />
      </div>
    </div>
  ),
});

export function PoolList() {
  const { positions, totalValueUsd, isLoading } = useAavePositions();
  const { riskDepth } = useRiskDepth();

  // Get display info for current risk depth
  const currentDepth = riskDepth || 'shallows';
  const depthInfo = depthLabels[currentDepth];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">Tidal</span>
        </div>
      </div>

      {/* Current Strategy */}
      <div className="p-3">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Your Strategy</div>
        <div className="w-full text-left p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{depthInfo.emoji}</span>
              <div>
                <div className="font-medium text-sm text-slate-200">{depthInfo.name}</div>
                <div className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${depthColors[currentDepth]}`}>
                  {currentDepth.replace('-', ' ')}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-right">
            {isLoading ? (
              <div className="h-5 w-16 bg-slate-700 rounded animate-pulse ml-auto" />
            ) : (
              <span className="text-sm font-mono text-slate-400">
                ${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Positions Summary */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Active Positions</div>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
          </div>
        ) : positions.length === 0 ? (
          <div className="p-4 rounded-lg border border-dashed border-slate-700 text-center">
            <p className="text-xs text-slate-500">No positions yet</p>
            <p className="text-xs text-slate-600 mt-1">Chat with Tidal to get started</p>
          </div>
        ) : (
          positions.map((position) => (
            <div
              key={position.token}
              className="p-3 rounded-lg bg-white/5 border border-transparent hover:border-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    position.token === 'USDC' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {position.token === 'USDC' ? '$' : 'Ξ'}
                  </span>
                  <span className="text-sm text-slate-300">{position.token}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-slate-300">{position.suppliedFormatted}</div>
                  <div className="text-xs text-emerald-400">{position.currentApy.toFixed(2)}% APY</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Section - dynamically loaded to avoid hydration issues */}
      <div className="p-3 border-t border-white/5">
        <WalletSection />
      </div>
    </div>
  );
}
