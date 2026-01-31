'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RISK_DEPTHS, type RiskDepth } from '@/lib/constants';

const depthDetails: Record<RiskDepth, {
  visual: string;
  examples: string[];
  apy: string;
}> = {
  shallows: {
    visual: '🏖️',
    examples: ['AAVE USDC lending', 'Stablecoin vaults'],
    apy: '3-5%',
  },
  'mid-depth': {
    visual: '🌊',
    examples: ['LP positions', 'Multi-asset strategies'],
    apy: '5-10%',
  },
  'deep-water': {
    visual: '🐋',
    examples: ['Leverage strategies', 'Volatile pairs'],
    apy: '10-20%+',
  },
};

export default function OnboardPage() {
  const router = useRouter();
  const [selectedDepth, setSelectedDepth] = useState<RiskDepth | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedDepth) return;

    setIsSubmitting(true);

    // Store preference (localStorage for now, could be database later)
    localStorage.setItem('tidal-risk-depth', selectedDepth);

    // Navigate to dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen tidal-bg tidal-caustics flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">Tidal</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-3">
              Choose your depth
            </h1>
            <p className="text-slate-400 max-w-md mx-auto">
              How deep do you want to dive? This helps Tidal recommend strategies that match your risk comfort.
            </p>
          </div>

          {/* Depth Options */}
          <div className="grid gap-4">
            {(Object.keys(RISK_DEPTHS) as RiskDepth[]).map((depth) => {
              const config = RISK_DEPTHS[depth];
              const details = depthDetails[depth];
              const isSelected = selectedDepth === depth;

              return (
                <button
                  key={depth}
                  onClick={() => setSelectedDepth(depth)}
                  className={`relative p-5 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Selection indicator */}
                  <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-4xl">{details.visual}</div>

                    {/* Content */}
                    <div className="flex-1 pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-slate-100">
                          {config.label}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          depth === 'shallows' ? 'bg-cyan-500/20 text-cyan-300' :
                          depth === 'mid-depth' ? 'bg-teal-500/20 text-teal-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {details.apy} APY
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                        {config.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {details.examples.map((example) => (
                          <span
                            key={example}
                            className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-500"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Note */}
          <p className="text-center text-sm text-slate-600 mt-6">
            You can change this anytime in settings or by asking Tidal
          </p>

          {/* Continue Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleContinue}
              disabled={!selectedDepth || isSubmitting}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold hover:from-cyan-400 hover:to-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-md hover:glow-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <span>Start Exploring</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
