'use client';

import type { Route } from '@lifi/sdk';
import { formatUnits } from 'viem';

interface RouteDisplayProps {
  route: Route;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function RouteDisplay({ route, isSelected, onSelect }: RouteDisplayProps) {
  const step = route.steps[0];
  if (!step) return null;

  const fromToken = step.action.fromToken;
  const toToken = step.action.toToken;
  const fromAmount = formatUnits(BigInt(step.action.fromAmount), fromToken.decimals);
  const toAmount = formatUnits(BigInt(step.estimate.toAmount), toToken.decimals);
  const toAmountMin = formatUnits(BigInt(step.estimate.toAmountMin), toToken.decimals);

  const tool = step.toolDetails?.name || step.tool;
  const gasCostUSD = route.gasCostUSD ? parseFloat(route.gasCostUSD).toFixed(2) : '0.00';
  const duration = step.estimate?.executionDuration
    ? Math.ceil(step.estimate.executionDuration / 60)
    : 1;

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border text-left transition-all ${
        isSelected
          ? 'bg-cyan-500/10 border-cyan-500/40'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      {/* Route Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300">
            via {tool}
          </span>
          <span className="text-xs text-slate-500">
            ~{duration} min
          </span>
        </div>
        <span className="text-xs text-slate-500">
          ${gasCostUSD} gas
        </span>
      </div>

      {/* Swap Details */}
      <div className="flex items-center gap-3">
        {/* From */}
        <div className="flex-1">
          <div className="text-xs text-slate-500 mb-1">From</div>
          <div className="flex items-center gap-2">
            {fromToken.logoURI && (
              <img src={fromToken.logoURI} alt={fromToken.symbol} className="w-6 h-6 rounded-full" />
            )}
            <div>
              <span className="font-mono text-slate-200">
                {parseFloat(fromAmount).toFixed(2)}
              </span>
              <span className="text-slate-400 ml-1">{fromToken.symbol}</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* To */}
        <div className="flex-1 text-right">
          <div className="text-xs text-slate-500 mb-1">To (estimated)</div>
          <div className="flex items-center justify-end gap-2">
            <div>
              <span className="font-mono text-emerald-400">
                {parseFloat(toAmount).toFixed(4)}
              </span>
              <span className="text-slate-400 ml-1">{toToken.symbol}</span>
            </div>
            {toToken.logoURI && (
              <img src={toToken.logoURI} alt={toToken.symbol} className="w-6 h-6 rounded-full" />
            )}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            Min: {parseFloat(toAmountMin).toFixed(4)} {toToken.symbol}
          </div>
        </div>
      </div>

      {/* Li.Fi Badge */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-slate-600">
          Powered by Li.Fi aggregator
        </span>
        {isSelected && (
          <span className="text-xs text-cyan-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Selected
          </span>
        )}
      </div>
    </button>
  );
}

interface RouteListProps {
  routes: Route[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function RouteList({ routes, selectedIndex, onSelect }: RouteListProps) {
  if (routes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No routes found for this swap
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {routes.length} route{routes.length !== 1 ? 's' : ''} found via Li.Fi
        </span>
        <span className="text-xs text-slate-600">
          Best rate shown first
        </span>
      </div>
      {routes.map((route, index) => (
        <RouteDisplay
          key={route.id}
          route={route}
          isSelected={index === selectedIndex}
          onSelect={() => onSelect(index)}
        />
      ))}
    </div>
  );
}
