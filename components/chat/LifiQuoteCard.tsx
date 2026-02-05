'use client';

// Token icon mapping for common Base tokens
const TOKEN_ICONS: Record<string, { bg: string; text: string; symbol: string }> = {
  USDC: { bg: 'bg-blue-500/20', text: 'text-blue-400', symbol: '$' },
  WETH: { bg: 'bg-purple-500/20', text: 'text-purple-400', symbol: '\u039E' },
  ETH: { bg: 'bg-purple-500/20', text: 'text-purple-400', symbol: '\u039E' },
  DAI: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', symbol: '\u25C7' },
  USDT: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', symbol: '$' },
};

interface LifiQuoteCardProps {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: number;
  estimatedGas?: string;
  route?: string;
  toolUsed?: string;
  executionTime?: string;
}

export function LifiQuoteCard({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  rate,
  estimatedGas,
  route,
  toolUsed,
  executionTime,
}: LifiQuoteCardProps) {
  const fromIcon = TOKEN_ICONS[fromToken] || { bg: 'bg-slate-500/20', text: 'text-slate-400', symbol: '?' };
  const toIcon = TOKEN_ICONS[toToken] || { bg: 'bg-slate-500/20', text: 'text-slate-400', symbol: '?' };

  // Extract DEX name from route string or toolUsed
  const dexName = toolUsed || (route?.match(/Li\.Fi \((\w+)\)/)?.[1]) || 'Aggregated';

  return (
    <div className="my-3 ml-7 rounded-xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-cyan-950/40 relative">
      {/* Subtle shimmer overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none animate-shimmer" />

      {/* Header: Li.Fi Badge */}
      <div className="relative px-4 py-2.5 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/5 border-b border-cyan-500/15 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Li.Fi "logo" mark */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400/20">
            <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-bold tracking-wide text-cyan-300">Li.Fi</span>
          </div>
          <span className="text-xs text-slate-500">Swap Quote</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Route Visualization */}
      <div className="relative px-4 py-4">
        <div className="flex items-center gap-3">
          {/* From Token */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-full ${fromIcon.bg} flex items-center justify-center text-lg font-bold ${fromIcon.text} ring-1 ring-white/5`}>
                {fromIcon.symbol}
              </div>
              <div className="min-w-0">
                <div className="text-base font-mono text-slate-200 truncate">{fromAmount}</div>
                <div className="text-xs text-slate-500">{fromToken}</div>
              </div>
            </div>
          </div>

          {/* Route Arrow with DEX badge */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 px-1">
            {/* Animated dotted path */}
            <div className="relative">
              <svg width="60" height="24" viewBox="0 0 60 24" className="text-cyan-400/60">
                <line x1="0" y1="12" x2="48" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
                </line>
                <polygon points="48,6 60,12 48,18" fill="currentColor" opacity="0.8" />
              </svg>
            </div>
            {/* DEX badge */}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/20 font-medium whitespace-nowrap">
              {dexName}
            </span>
          </div>

          {/* To Token */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 justify-end">
              <div className="min-w-0 text-right">
                <div className="text-base font-mono text-emerald-400 truncate">{toAmount}</div>
                <div className="text-xs text-slate-500">{toToken}</div>
              </div>
              <div className={`w-10 h-10 rounded-full ${toIcon.bg} flex items-center justify-center text-lg font-bold ${toIcon.text} ring-1 ring-white/5`}>
                {toIcon.symbol}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 text-xs">
          {/* Rate */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5">
            <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-slate-400">1 {fromToken} = <span className="text-slate-200 font-mono">{rate.toFixed(6)}</span> {toToken}</span>
          </div>
          {/* Gas */}
          {estimatedGas && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5">
              <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-slate-400">{estimatedGas}</span>
            </div>
          )}
          {/* Time */}
          {executionTime && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5">
              <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-slate-400">{executionTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Li.Fi attribution */}
      <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-600 flex items-center gap-1">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Routing across multiple DEXs for best rate
        </span>
        <span className="text-[10px] text-cyan-500/50 font-medium">Powered by Li.Fi</span>
      </div>
    </div>
  );
}
