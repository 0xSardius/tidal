'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';

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

export function PoolList() {
  const [activePool, setActivePool] = useState('1');
  const { ready, authenticated, displayAddress, login, logout, usdcBalance } = useWallet();

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

      {/* User Section */}
      <div className="p-3 border-t border-white/5">
        {!ready ? (
          // Loading state
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-16 bg-slate-800 rounded mt-1 animate-pulse" />
            </div>
          </div>
        ) : authenticated ? (
          // Connected state
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-xs font-bold">
              0x
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-slate-200">
                {displayAddress}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {usdcBalance} USDC
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        ) : (
          // Not connected state
          <button
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium text-sm hover:from-cyan-400 hover:to-teal-400 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}
