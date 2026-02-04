'use client';

import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { getSwapQuote, executeSwapFromQuote, configureLifi, type RouteExecutionStatus } from '@/lib/lifi';
import { executeAaveSupply, executeAaveWithdraw, type AaveExecutionStatus, type AaveToken } from '@/lib/aave';

interface ActionCardProps {
  action: string;
  protocol?: string;
  provider?: string;
  token?: string;
  amount?: string;
  // Swap-specific props
  fromToken?: string;
  toToken?: string;
  fromTokenAddress?: string;
  toTokenAddress?: string;
  fromDecimals?: number;
  toDecimals?: number;
  chainId?: number;
  // Display props
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
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

type ExecutionStatus = 'idle' | 'quoting' | 'pending' | 'executing' | 'completed' | 'failed';

export function ActionCard({
  action,
  protocol,
  provider,
  token,
  amount,
  fromToken,
  toToken,
  fromTokenAddress,
  toTokenAddress,
  fromDecimals,
  toDecimals,
  chainId,
  estimatedApy,
  estimatedYearlyReturn,
  steps,
  risks,
  note,
  onApprove,
  onReject,
  onSuccess,
  onError,
}: ActionCardProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();

  const handleApprove = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      setStatus('failed');
      onError?.('Wallet not connected');
      return;
    }

    // For swap actions, execute via Li.Fi
    if (action === 'swap' && fromTokenAddress && toTokenAddress && amount && fromDecimals) {
      setStatus('quoting');
      setStatusMessage('Getting best rate...');
      setError(undefined);

      try {
        // Configure Li.Fi with wallet providers
        configureLifi();

        // Fetch fresh quote with user's actual address
        const fromAmountWei = parseUnits(amount, fromDecimals).toString();
        const quoteResult = await getSwapQuote({
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          fromAmount: fromAmountWei,
          fromChain: chainId || 8453,
          toChain: chainId || 8453,
          fromAddress: address,
        });

        if (!quoteResult.success || !quoteResult.quote) {
          throw new Error(quoteResult.error || 'Failed to get quote');
        }

        setStatus('pending');
        setStatusMessage('Confirm in your wallet...');

        // Execute the swap
        const result = await executeSwapFromQuote(
          quoteResult.quote,
          (update: RouteExecutionStatus) => {
            setStatus(update.status === 'completed' ? 'completed' :
                     update.status === 'failed' ? 'failed' : 'executing');
            setStatusMessage(update.message);
            if (update.txHash) {
              setTxHash(update.txHash);
            }
          }
        );

        if (result.success) {
          setStatus('completed');
          setStatusMessage('Swap completed!');
          onApprove?.();
          if (txHash) onSuccess?.(txHash);
        } else {
          throw new Error(result.error || 'Swap failed');
        }
      } catch (err) {
        console.error('Swap error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Swap failed';
        setError(errorMsg);
        setStatus('failed');
        setStatusMessage('Transaction failed');
        onError?.(errorMsg);
      }
    }
    // For AAVE supply actions
    else if (action === 'supply' && token && amount && walletClient && publicClient) {
      setStatus('pending');
      setStatusMessage('Preparing supply...');
      setError(undefined);

      try {
        const result = await executeAaveSupply({
          chainId: chainId || 8453, // Base Mainnet
          token: token as AaveToken,
          amount,
          userAddress: address,
          walletClient: walletClient as never,
          publicClient: publicClient as never,
          onUpdate: (update: AaveExecutionStatus) => {
            setStatusMessage(update.message);
            if (update.txHash) {
              setTxHash(update.txHash);
            }
            if (update.status === 'completed') {
              setStatus('completed');
            } else if (update.status === 'failed') {
              setStatus('failed');
            } else {
              setStatus('executing');
            }
          },
        });

        if (result.success) {
          setStatus('completed');
          setStatusMessage('Supply completed!');
          onApprove?.();
          if (result.txHash) onSuccess?.(result.txHash);
        } else {
          throw new Error(result.error || 'Supply failed');
        }
      } catch (err) {
        console.error('Supply error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Supply failed';
        setError(errorMsg);
        setStatus('failed');
        setStatusMessage('Transaction failed');
        onError?.(errorMsg);
      }
    }
    // For AAVE withdraw actions
    else if (action === 'withdraw' && token && amount && walletClient && publicClient) {
      setStatus('pending');
      setStatusMessage('Preparing withdrawal...');
      setError(undefined);

      try {
        const result = await executeAaveWithdraw({
          chainId: chainId || 8453,
          token: token as AaveToken,
          amount,
          userAddress: address,
          walletClient: walletClient as never,
          publicClient: publicClient as never,
          onUpdate: (update: AaveExecutionStatus) => {
            setStatusMessage(update.message);
            if (update.txHash) {
              setTxHash(update.txHash);
            }
            if (update.status === 'completed') {
              setStatus('completed');
            } else if (update.status === 'failed') {
              setStatus('failed');
            } else {
              setStatus('executing');
            }
          },
        });

        if (result.success) {
          setStatus('completed');
          setStatusMessage('Withdrawal completed!');
          onApprove?.();
          if (result.txHash) onSuccess?.(result.txHash);
        } else {
          throw new Error(result.error || 'Withdrawal failed');
        }
      } catch (err) {
        console.error('Withdraw error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Withdrawal failed';
        setError(errorMsg);
        setStatus('failed');
        setStatusMessage('Transaction failed');
        onError?.(errorMsg);
      }
    }
    // For other/unknown actions, just call the callback
    else {
      setStatus('pending');
      onApprove?.();
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const handleReject = () => {
    setStatus('idle');
    setError(undefined);
    onReject?.();
  };

  const isProcessing = status !== 'idle' && status !== 'completed' && status !== 'failed';

  const actionLabel = action === 'supply' ? 'Supply to AAVE' :
                      action === 'withdraw' ? 'Withdraw from AAVE' :
                      action === 'swap' ? `Swap ${fromToken} → ${toToken}` :
                      action === 'swap_and_supply' ? 'Swap & Supply' :
                      action;

  const actionIcon = action === 'supply' ? '📥' :
                     action === 'withdraw' ? '📤' :
                     action === 'swap' ? '🔄' :
                     action === 'swap_and_supply' ? '🔄' : '⚡';

  const displayProvider = provider || protocol;

  return (
    <div className="bg-slate-800/60 rounded-xl border border-cyan-500/20 overflow-hidden my-3">
      {/* Header */}
      <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-3">
        <span className="text-xl">{actionIcon}</span>
        <div className="flex-1">
          <h4 className="font-medium text-white text-sm">{actionLabel}</h4>
          {displayProvider && (
            <p className="text-xs text-slate-400">
              via {displayProvider}
              {action === 'swap' && (
                <span className="ml-1 text-cyan-400">• Powered by Li.Fi</span>
              )}
            </p>
          )}
        </div>
        {status === 'completed' && (
          <span className="text-emerald-400 text-sm">✓ Done</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Swap details */}
        {action === 'swap' && fromToken && toToken && amount && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Swap</span>
            <span className="text-sm font-medium text-white">
              {amount} {fromToken} → {toToken}
            </span>
          </div>
        )}

        {/* Simple action details */}
        {token && amount && !steps && action !== 'swap' && (
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

        {/* Status message during execution */}
        {isProcessing && statusMessage && (
          <div className="flex items-center gap-2 text-sm text-cyan-400 bg-cyan-500/10 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {statusMessage}
          </div>
        )}

        {/* Transaction hash */}
        {txHash && (
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
          >
            <span>View on BaseScan</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Actions */}
      {status !== 'completed' && (
        <div className="px-4 py-3 bg-white/5 flex gap-2">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing || !isConnected}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {status === 'quoting' ? 'Getting Quote...' :
                 status === 'pending' ? 'Confirm in Wallet' : 'Processing...'}
              </span>
            ) : !isConnected ? (
              'Connect Wallet'
            ) : (
              'Approve'
            )}
          </button>
        </div>
      )}

      {/* Success state */}
      {status === 'completed' && (
        <div className="px-4 py-3 bg-emerald-500/10 text-center">
          <p className="text-sm text-emerald-400">Transaction completed successfully!</p>
        </div>
      )}
    </div>
  );
}
