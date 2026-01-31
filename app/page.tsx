'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/hooks/useWallet';
import { useRiskDepth } from '@/lib/hooks/useRiskDepth';

export default function Home() {
  const router = useRouter();
  const { ready, authenticated, login } = useWallet();
  const { isLoaded, hasSelected } = useRiskDepth();

  // Redirect authenticated users
  useEffect(() => {
    if (ready && authenticated && isLoaded) {
      if (hasSelected) {
        router.push('/dashboard');
      } else {
        router.push('/onboard');
      }
    }
  }, [ready, authenticated, isLoaded, hasSelected, router]);

  const handleDiveIn = () => {
    if (authenticated) {
      if (hasSelected) {
        router.push('/dashboard');
      } else {
        router.push('/onboard');
      }
    } else {
      login();
    }
  };

  return (
    <div className="min-h-screen tidal-bg tidal-caustics flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">Tidal</span>
        </div>
        <button
          onClick={handleDiveIn}
          disabled={!ready}
          className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authenticated ? 'Launch App' : 'Connect'}
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          {/* Floating icon */}
          <div className="inline-flex mb-8 animate-float">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center glow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            <span className="text-slate-100">Your AI-managed</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 text-glow">
              tidal pool
            </span>
            <span className="text-slate-100"> in the DeFi ocean</span>
          </h1>

          <p className="text-lg text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Navigate DeFi yields with an AI that explains every move.
            No complexity, just calm waters earning for you.
          </p>

          {/* CTA */}
          <button
            onClick={handleDiveIn}
            disabled={!ready}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold hover:from-cyan-400 hover:to-teal-400 transition-all glow-md hover:glow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{authenticated ? 'Go to Dashboard' : 'Dive In'}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          {/* Trust badges */}
          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Non-custodial
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Powered by Base
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI-assisted
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/5 text-center text-xs text-slate-600">
        Built for ETH Global HackMoney 2026 · Powered by Li.Fi, AAVE, and Claude
      </footer>
    </div>
  );
}
