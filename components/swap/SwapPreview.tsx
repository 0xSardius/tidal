'use client';

import { useState } from 'react';
import type { Route } from '@lifi/sdk';
import { formatUnits } from 'viem';

interface SwapPreviewProps {
  route: Route;
  onApprove: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export function SwapPreview({ route, onApprove, onCancel, isExecuting }: SwapPreviewProps) {
  const step = route.steps[0];
  if (!step) return null;

  const fromToken = step.action.fromToken;
  const toToken = step.action.toToken;
  const fromAmount = formatUnits(BigInt(step.action.fromAmount), fromToken.decimals);
  const toAmount = formatUnits(BigInt(step.estimate.toAmount), toToken.decimals);
  const toAmountMin = formatUnits(BigInt(step.estimate.toAmountMin), toToken.decimals);

  const tool = step.toolDetails?.name || step.tool;
  const gasCostUSD = route.gasCostUSD ? parseFloat(route.gasCostUSD).toFixed(2) : '0.00';

  return (
    <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-4 my-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium text-slate-200">Swap Preview</div>
          <div className="text-xs text-slate-500">via Li.Fi → {tool}</div>
        </div>
      </div>

      {/* Swap Visual */}
      <div className="flex items-center justify-between mb-4">
        {/* From */}
        <div className="flex items-center gap-3">
          {fromToken.logoURI && (
            <img src={fromToken.logoURI} alt={fromToken.symbol} className="w-10 h-10 rounded-full" />
          )}
          <div>
            <div className="text-lg font-mono text-slate-200">
              {parseFloat(fromAmount).toFixed(2)}
            </div>
            <div className="text-sm text-slate-500">{fromToken.symbol}</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="px-4">
          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* To */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-mono text-emerald-400">
              {parseFloat(toAmount).toFixed(4)}
            </div>
            <div className="text-sm text-slate-500">{toToken.symbol}</div>
          </div>
          {toToken.logoURI && (
            <img src={toToken.logoURI} alt={toToken.symbol} className="w-10 h-10 rounded-full" />
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div className="p-2 rounded-lg bg-white/5">
          <div className="text-slate-500">Minimum received</div>
          <div className="text-slate-300 font-mono">
            {parseFloat(toAmountMin).toFixed(4)} {toToken.symbol}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <div className="text-slate-500">Estimated gas</div>
          <div className="text-slate-300 font-mono">${gasCostUSD}</div>
        </div>
      </div>

      {/* Li.Fi Attribution */}
      <div className="text-xs text-slate-600 mb-4 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Li.Fi aggregates routes across multiple DEXs for the best rate
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onApprove}
          disabled={isExecuting}
          className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium hover:from-cyan-400 hover:to-teal-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isExecuting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Executing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Confirm Swap</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
