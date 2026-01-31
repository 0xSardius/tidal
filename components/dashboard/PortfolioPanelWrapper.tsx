'use client';

import dynamic from 'next/dynamic';

const PortfolioPanel = dynamic(
  () => import('./PortfolioPanel').then((mod) => ({ default: mod.PortfolioPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-white/5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Your Pool
          </div>
        </div>
        <div className="p-4 border-b border-white/5">
          <div className="text-xs text-slate-500 mb-1">Total Value</div>
          <div className="h-9 w-32 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-3">
            <div className="h-20 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-20 bg-slate-800/50 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    ),
  }
);

export function PortfolioPanelWrapper() {
  return <PortfolioPanel />;
}
