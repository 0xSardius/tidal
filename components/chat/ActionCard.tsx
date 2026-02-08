'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useSwitchChain } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { getWalletClient } from '@wagmi/core';
import { parseUnits } from 'viem';
import { base } from 'viem/chains';
import { wagmiConfig } from '@/lib/wagmi';
import { getSwapQuote, executeSwapFromQuote, configureLifi, type RouteExecutionStatus } from '@/lib/lifi';
import { executeAaveSupply, executeAaveWithdraw, type AaveExecutionStatus, type AaveToken } from '@/lib/aave';
import { executeVaultDeposit, executeVaultWithdraw, type VaultExecutionStatus } from '@/lib/vaults';
import { getVault } from '@/lib/vault-registry';

// Parse blockchain/wallet errors into friendly messages
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('user rejected') || lower.includes('user denied') || lower.includes('rejected the request'))
    return 'Transaction cancelled. You can try again when ready.';
  if (lower.includes('insufficient funds') || lower.includes('exceeds balance') || lower.includes('insufficient balance') || lower.includes('balance is too low') || lower.includes('balanceerror'))
    return 'Insufficient balance. Check that you have enough tokens and ETH for gas.';
  if (lower.includes('slippage') || lower.includes('price movement'))
    return 'Price moved too much during execution. Try again with a fresh quote.';
  if (lower.includes('nonce') || lower.includes('replacement'))
    return 'Transaction conflict. Wait for pending transactions to complete and try again.';
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('fetch'))
    return 'Network error. Check your connection and try again.';
  if (lower.includes('allowance') || lower.includes('approve'))
    return 'Token approval needed. Please approve the token spend in your wallet.';
  if (lower.includes('gas') && lower.includes('estimate'))
    return 'Transaction may fail. You might not have enough tokens or the pool may be unavailable.';

  // Truncate very long error messages
  if (msg.length > 120) return msg.slice(0, 117) + '...';
  return msg;
}

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
  // Vault-specific props
  vaultSlug?: string;
  vaultName?: string;
  curator?: string;
  vaultAddress?: string;
  underlyingAddress?: string;
  underlyingDecimals?: number;
  description?: string;
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
type ComboStep = 0 | 1 | 2; // 0 = not started, 1 = swapping, 2 = supplying

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
  vaultSlug,
  vaultName,
  curator,
  vaultAddress,
  underlyingAddress,
  underlyingDecimals,
  description,
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
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const { switchChain } = useSwitchChain();
  const queryClient = useQueryClient();

  const invalidatePositions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['readContract'] });
    queryClient.invalidateQueries({ queryKey: ['readContracts'] });
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    // Delayed second pass — some RPCs take a few seconds to index new state
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      queryClient.invalidateQueries({ queryKey: ['readContracts'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    }, 4000);
  }, [queryClient]);

  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();
  const [comboStep, setComboStep] = useState<ComboStep>(0);

  const isWrongChain = chain?.id !== base.id;

  const handleApprove = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      setStatus('failed');
      onError?.('Wallet not connected');
      return;
    }

    // Check if on correct chain, prompt to switch if not
    if (isWrongChain) {
      setStatus('pending');
      setStatusMessage('Switching to Base network...');
      try {
        await switchChain({ chainId: base.id });
        // After switching, user needs to click again
        setStatus('idle');
        setStatusMessage('');
        setError('Switched to Base. Please click Approve again.');
        return;
      } catch (err) {
        setError('Please switch to Base network in your wallet');
        setStatus('failed');
        return;
      }
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
          invalidatePositions();
          onApprove?.();
          if (txHash) onSuccess?.(txHash);
        } else {
          throw new Error(result.error || 'Swap failed');
        }
      } catch (err) {
        console.error('Swap error:', err);
        const errorMsg = friendlyError(err);
        setError(errorMsg);
        setStatus('failed');
        setStatusMessage('');
        onError?.(errorMsg);
      }
    }
    // For AAVE supply actions
    else if (action === 'supply') {
      // Check for missing requirements
      if (!token || !amount) {
        setError('Missing token or amount');
        setStatus('failed');
        return;
      }
      if (!publicClient) {
        setError('Network connection not ready. Please try again.');
        setStatus('failed');
        return;
      }

      setStatus('pending');
      setStatusMessage('Preparing supply...');
      setError(undefined);

      try {
        // Fetch wallet client lazily (Privy doesn't provide it via useWalletClient hook reliably)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wc = await getWalletClient(wagmiConfig as any, { chainId: base.id });
        if (!wc) {
          throw new Error('Wallet not ready. Please reconnect and try again.');
        }

        const result = await executeAaveSupply({
          chainId: chainId || 8453, // Base Mainnet
          token: token as AaveToken,
          amount,
          userAddress: address,
          walletClient: wc as never,
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
          invalidatePositions();
          onApprove?.();
          if (result.txHash) onSuccess?.(result.txHash);
        } else {
          throw new Error(result.error || 'Supply failed');
        }
      } catch (err) {
        console.error('Supply error:', err);
        const errorMsg = friendlyError(err);
        setError(errorMsg);
        setStatus('failed');
        setStatusMessage('');
        onError?.(errorMsg);
      }
    }
    // For AAVE withdraw actions
    else if (action === 'withdraw') {
      if (!token || !amount) {
        setError('Missing token or amount');
        setStatus('failed');
        return;
      }
      if (!publicClient) {
        setError('Network connection not ready. Please try again.');
        setStatus('failed');
        return;
      }

      setStatus('pending');
      setStatusMessage('Preparing withdrawal...');
      setError(undefined);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wc = await getWalletClient(wagmiConfig as any, { chainId: base.id });
        if (!wc) {
          throw new Error('Wallet not ready. Please reconnect and try again.');
        }

        const result = await executeAaveWithdraw({
          chainId: chainId || 8453,
          token: token as AaveToken,
          amount,
          userAddress: address,
          walletClient: wc as never,
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
          invalidatePositions();
          onApprove?.();
          if (result.txHash) onSuccess?.(result.txHash);
        } else {
          throw new Error(result.error || 'Withdrawal failed');
        }
      } catch (err) {
        console.error('Withdraw error:', err);
        const errorMsg = friendlyError(err);
        setError(errorMsg);
        setStatus('failed');
        setStatusMessage('');
        onError?.(errorMsg);
      }
    }
    // For swap + supply combo
    else if (action === 'swap_and_supply' && fromTokenAddress && toTokenAddress && amount && fromDecimals && toDecimals) {
      if (!publicClient) {
        setError('Network connection not ready. Please try again.');
        setStatus('failed');
        return;
      }

      setStatus('quoting');
      setComboStep(1);
      setStatusMessage('Step 1/2: Getting best swap rate via Li.Fi...');
      setError(undefined);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wc = await getWalletClient(wagmiConfig as any, { chainId: base.id });
        if (!wc) {
          throw new Error('Wallet not ready. Please reconnect and try again.');
        }
        // Step 1: Execute swap via Li.Fi
        configureLifi();
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
          throw new Error(quoteResult.error || 'Failed to get swap quote');
        }

        setStatus('pending');
        setStatusMessage('Step 1/2: Confirm swap in your wallet...');

        const swapResult = await executeSwapFromQuote(
          quoteResult.quote,
          (update: RouteExecutionStatus) => {
            setStatus(update.status === 'completed' ? 'executing' :
                     update.status === 'failed' ? 'failed' : 'executing');
            setStatusMessage(`Step 1/2: ${update.message}`);
            if (update.txHash) {
              setTxHash(update.txHash);
            }
          }
        );

        if (!swapResult.success) {
          throw new Error(swapResult.error || 'Swap failed');
        }

        // Step 2: Supply swapped tokens to AAVE
        setComboStep(2);
        setStatus('pending');
        setStatusMessage('Step 2/2: Supplying to AAVE...');

        // Determine supply token and amount
        // The toToken from the swap is what we supply
        const supplyToken = toToken as AaveToken;
        // Use max balance approach - supply whatever we received from swap
        const supplyAmount = 'max';

        const supplyResult = await executeAaveSupply({
          chainId: chainId || 8453,
          token: supplyToken,
          amount: supplyAmount,
          userAddress: address,
          walletClient: wc as never,
          publicClient: publicClient as never,
          onUpdate: (update: AaveExecutionStatus) => {
            setStatusMessage(`Step 2/2: ${update.message}`);
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

        if (supplyResult.success) {
          setStatus('completed');
          setStatusMessage('Swap & Supply completed!');
          setComboStep(0);
          invalidatePositions();
          onApprove?.();
          if (supplyResult.txHash) onSuccess?.(supplyResult.txHash);
        } else {
          throw new Error(supplyResult.error || 'Supply step failed');
        }
      } catch (err) {
        console.error('Swap & Supply error:', err);
        const errorMsg = friendlyError(err);
        setError(errorMsg);
        setStatus('failed');
        setStatusMessage('');
        onError?.(errorMsg);
      }
    }
    // For ERC-4626 vault deposit
    else if (action === 'vault_deposit' && vaultSlug && amount) {
      if (!publicClient) {
        setError('Network connection not ready. Please try again.');
        setStatus('failed');
        return;
      }

      const vault = getVault(vaultSlug);
      if (!vault) {
        setError(`Vault "${vaultSlug}" not found.`);
        setStatus('failed');
        return;
      }

      setStatus('pending');
      setStatusMessage('Preparing vault deposit...');
      setError(undefined);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wc = await getWalletClient(wagmiConfig as any, { chainId: base.id });
        if (!wc) {
          throw new Error('Wallet not ready. Please reconnect and try again.');
        }

        const result = await executeVaultDeposit({
          vault,
          amount,
          userAddress: address,
          walletClient: wc as never,
          publicClient: publicClient as never,
          onUpdate: (update: VaultExecutionStatus) => {
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
          setStatusMessage('Deposit completed!');
          invalidatePositions();
          onApprove?.();
          if (result.txHash) onSuccess?.(result.txHash);
        } else {
          throw new Error(result.error || 'Vault deposit failed');
        }
      } catch (err) {
        console.error('Vault deposit error:', err);
        const errorMsg = friendlyError(err);
        setError(errorMsg);
        setStatus('failed');
        setStatusMessage('');
        onError?.(errorMsg);
      }
    }
    // For ERC-4626 vault withdrawal
    else if (action === 'vault_withdraw' && vaultSlug) {
      if (!publicClient) {
        setError('Network connection not ready. Please try again.');
        setStatus('failed');
        return;
      }

      const vault = getVault(vaultSlug);
      if (!vault) {
        setError(`Vault "${vaultSlug}" not found.`);
        setStatus('failed');
        return;
      }

      setStatus('pending');
      setStatusMessage('Preparing vault withdrawal...');
      setError(undefined);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wc = await getWalletClient(wagmiConfig as any, { chainId: base.id });
        if (!wc) {
          throw new Error('Wallet not ready. Please reconnect and try again.');
        }

        const result = await executeVaultWithdraw({
          vault,
          amount: amount || 'max',
          userAddress: address,
          walletClient: wc as never,
          publicClient: publicClient as never,
          onUpdate: (update: VaultExecutionStatus) => {
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
          invalidatePositions();
          onApprove?.();
          if (result.txHash) onSuccess?.(result.txHash);
        } else {
          throw new Error(result.error || 'Vault withdrawal failed');
        }
      } catch (err) {
        console.error('Vault withdraw error:', err);
        const errorMsg = friendlyError(err);
        setError(errorMsg);
        setStatus('failed');
        setStatusMessage('');
        onError?.(errorMsg);
      }
    }
    // For other/unknown actions, show error
    else {
      console.error('Unknown action or missing data:', { action, token, amount });
      setError(`Unknown action type: ${action}`);
      setStatus('failed');
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
                      action === 'vault_deposit' ? `Deposit to ${vaultName || 'Vault'}` :
                      action === 'vault_withdraw' ? `Withdraw from ${vaultName || 'Vault'}` :
                      action;

  const actionIcon = action === 'supply' ? '📥' :
                     action === 'withdraw' ? '📤' :
                     action === 'swap' ? '🔄' :
                     action === 'swap_and_supply' ? '🔄' :
                     action === 'vault_deposit' ? '🦋' :
                     action === 'vault_withdraw' ? '📤' : '⚡';

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
            </p>
          )}
        </div>
        {(action === 'swap' || action === 'swap_and_supply') && status !== 'completed' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400/20">
            <svg className="w-3 h-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide text-cyan-300">Li.Fi</span>
          </div>
        )}
        {(action === 'vault_deposit' || action === 'vault_withdraw') && curator && status !== 'completed' && (
          protocol === 'yo' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/20">
              <span className="text-xs">🚀</span>
              <span className="text-[10px] font-bold tracking-wide text-emerald-300">YO</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/20">
              <span className="text-xs">🦋</span>
              <span className="text-[10px] font-bold tracking-wide text-purple-300">Morpho</span>
            </div>
          )
        )}
        {status === 'completed' && (
          <span className="text-emerald-400 text-sm">✓ Done</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Swap route visualization */}
        {action === 'swap' && fromToken && toToken && amount && (
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-3">
              {/* From */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ring-1 ring-white/5 ${
                  fromToken === 'USDC' || fromToken === 'USDT' ? 'bg-blue-500/20 text-blue-400' :
                  fromToken === 'ETH' || fromToken === 'WETH' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-teal-500/20 text-teal-400'
                }`}>
                  {fromToken === 'USDC' || fromToken === 'USDT' ? '$' : fromToken === 'ETH' || fromToken === 'WETH' ? '\u039E' : fromToken[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-mono text-slate-200">{amount}</div>
                  <div className="text-[10px] text-slate-500">{fromToken}</div>
                </div>
              </div>
              {/* Arrow */}
              <div className="flex-shrink-0">
                <svg width="40" height="16" viewBox="0 0 40 16" className="text-cyan-400/50">
                  <line x1="0" y1="8" x2="30" y2="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3">
                    <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
                  </line>
                  <polygon points="30,3 40,8 30,13" fill="currentColor" opacity="0.7" />
                </svg>
              </div>
              {/* To */}
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <div className="min-w-0 text-right">
                  <div className="text-sm font-mono text-emerald-400">{toToken}</div>
                  <div className="text-[10px] text-slate-500">Receiving</div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ring-1 ring-white/5 ${
                  toToken === 'USDC' || toToken === 'USDT' ? 'bg-blue-500/20 text-blue-400' :
                  toToken === 'ETH' || toToken === 'WETH' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-teal-500/20 text-teal-400'
                }`}>
                  {toToken === 'USDC' || toToken === 'USDT' ? '$' : toToken === 'ETH' || toToken === 'WETH' ? '\u039E' : toToken[0]}
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-slate-600">Routed via Li.Fi across multiple DEXs</span>
              <span className="text-[10px] text-cyan-500/50 font-medium">Powered by Li.Fi</span>
            </div>
          </div>
        )}

        {/* Vault info */}
        {(action === 'vault_deposit' || action === 'vault_withdraw') && vaultName && (
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-purple-300">{vaultName}</span>
              {curator && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                  Curated by {curator}
                </span>
              )}
            </div>
            {description && (
              <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
            )}
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
            {steps.map((step) => {
              const isActiveStep = comboStep === step.step && isProcessing;
              const isCompletedStep = comboStep > step.step || status === 'completed';
              return (
                <div
                  key={step.step}
                  className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                    isActiveStep ? 'bg-cyan-500/10 border border-cyan-500/20' :
                    isCompletedStep ? 'bg-emerald-500/5 border border-emerald-500/10' :
                    'bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                    isCompletedStep ? 'bg-emerald-500/20 text-emerald-400' :
                    isActiveStep ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-white/10 text-slate-500'
                  }`}>
                    {isCompletedStep ? '\u2713' : step.step}
                  </span>
                  <div>
                    <p className={`text-sm ${isCompletedStep ? 'text-emerald-300' : isActiveStep ? 'text-white' : 'text-slate-300'}`}>{step.description}</p>
                    <p className="text-xs text-slate-500">via {step.provider}</p>
                  </div>
                  {isActiveStep && (
                    <svg className="w-4 h-4 animate-spin text-cyan-400 ml-auto flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              );
            })}
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

        {/* Error message with retry */}
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 flex items-start gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="flex-1">{error}</span>
            {status === 'failed' && (
              <button
                onClick={() => { setStatus('idle'); setError(undefined); setComboStep(0); }}
                className="flex-shrink-0 text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2"
              >
                Retry
              </button>
            )}
          </div>
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
            ) : isWrongChain ? (
              'Switch to Base'
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
