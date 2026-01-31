'use client';

import { useState } from 'react';

interface ActionCardProps {
  action: string;
  protocol?: string;
  token?: string;
  amount?: string;
  estimatedApy?: number;
  estimatedYearlyReturn?: string;
  steps?: Array<{
    step: number;
    action: string;
    description: string;
    provider: string;
  }>;
  risks?: string[];
  note?: string | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ActionCard({
  action,
  protocol,
  token,
  amount,
  estimatedApy,
  estimatedYearlyReturn,
  steps,
  risks,
  note,
  onApprove,
  onReject,
}: ActionCardProps) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    onApprove?.();
    // In production, this would trigger the actual transaction
    setTimeout(() => setIsApproving(false), 2000);
  };

  const actionLabel = action === 'supply' ? 'Supply to AAVE' :
                      action === 'withdraw' ? 'Withdraw from AAVE' :
                      action === 'swap_and_supply' ? 'Swap & Supply' :
                      action;

  const actionIcon = action === 'supply' ? '📥' :
                     action === 'withdraw' ? '📤' :
                     action === 'swap_and_supply' ? '🔄' : '⚡';

  return (
    <div className="bg-slate-800/60 rounded-xl border border-cyan-500/20 overflow-hidden my-3">
      {/* Header */}
      <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-3">
        <span className="text-xl">{actionIcon}</span>
        <div>
          <h4 className="font-medium text-white text-sm">{actionLabel}</h4>
          {protocol && (
            <p className="text-xs text-slate-400">{protocol} · Base Sepolia</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Simple action details */}
        {token && amount && !steps && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Amount</span>
            <span className="text-sm font-medium text-white">
              {amount} {token}
            </span>
          </div>
        )}

        {estimatedApy && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Estimated APY</span>
            <span className="text-sm font-medium text-emerald-400">
              {estimatedApy.toFixed(2)}%
            </span>
          </div>
        )}

        {estimatedYearlyReturn && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Est. Yearly Return</span>
            <span className="text-sm font-medium text-white">
              {estimatedYearlyReturn}
            </span>
          </div>
        )}

        {/* Multi-step actions */}
        {steps && steps.length > 0 && (
          <div className="space-y-2">
            {steps.map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-3 p-2 bg-white/5 rounded-lg"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center">
                  {step.step}
                </span>
                <div>
                  <p className="text-sm text-white">{step.description}</p>
                  <p className="text-xs text-slate-500">via {step.provider}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Risks */}
        {risks && risks.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-xs text-slate-500 mb-1">Considerations:</p>
            <ul className="text-xs text-slate-400 space-y-0.5">
              {risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-slate-600">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Note */}
        {note && (
          <p className="text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
            {note}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-white/5 flex gap-2">
        <button
          onClick={() => onReject?.()}
          className="flex-1 px-4 py-2 text-sm rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="flex-1 px-4 py-2 text-sm rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApproving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Approving...
            </span>
          ) : (
            'Approve'
          )}
        </button>
      </div>
    </div>
  );
}
