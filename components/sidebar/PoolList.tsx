'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

interface Pool {
  id: string;
  name: string;
  emoji: string;
  value: number;
  depth: 'shallows' | 'mid-depth' | 'deep-water';
}

const mockPools: Pool[] = [
  { id: '1', name: 'Calm Waters', emoji: '🌊', value: 3200, depth: 'shallows' },
  { id: '2', name: 'Growth Current', emoji: '🐋', value: 2034, depth: 'mid-depth' },
];

const depthColors = {
  'shallows': 'bg-cyan-500/20 text-cyan-300',
  'mid-depth': 'bg-teal-500/20 text-teal-300',
  'deep-water': 'bg-blue-600/20 text-blue-300',
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
  const [activePool, setActivePool] = useState('1');

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

      {/* New Pool Button */}
      <div className="p-3">
        <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-200 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Pool
        </button>
      </div>

      {/* Pool List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {mockPools.map((pool) => (
          <button
            key={pool.id}
            onClick={() => setActivePool(pool.id)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
              activePool === pool.id
                ? 'bg-cyan-500/10 border border-cyan-500/20'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{pool.emoji}</span>
                <div>
                  <div className="font-medium text-sm text-slate-200">{pool.name}</div>
                  <div className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${depthColors[pool.depth]}`}>
                    {pool.depth.replace('-', ' ')}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-right">
              <span className="text-sm font-mono text-slate-400">
                ${pool.value.toLocaleString()}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* User Section - dynamically loaded to avoid hydration issues */}
      <div className="p-3 border-t border-white/5">
        <WalletSection />
      </div>
    </div>
  );
}
