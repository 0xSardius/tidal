'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { executeSwapFromQuote, type LiFiStep, type RouteExecutionStatus } from '@/lib/lifi';

export type SwapStatus = 'idle' | 'pending' | 'executing' | 'completed' | 'failed';

interface UseLifiExecuteReturn {
  status: SwapStatus;
  txHash?: string;
  message: string;
  error?: string;
  executeSwap: (quote: LiFiStep) => Promise<boolean>;
  reset: () => void;
}

export function useLifiExecute(): UseLifiExecuteReturn {
  const { isConnected } = useAccount();
  const [status, setStatus] = useState<SwapStatus>('idle');
  const [txHash, setTxHash] = useState<string>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string>();

  const handleStatusUpdate = useCallback((update: RouteExecutionStatus) => {
    setStatus(update.status);
    setMessage(update.message);
    if (update.txHash) {
      setTxHash(update.txHash);
    }
  }, []);

  const executeSwap = useCallback(async (quote: LiFiStep): Promise<boolean> => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      setStatus('failed');
      return false;
    }

    setStatus('pending');
    setMessage('Preparing transaction...');
    setError(undefined);
    setTxHash(undefined);

    try {
      const result = await executeSwapFromQuote(quote, handleStatusUpdate);

      if (result.success) {
        setStatus('completed');
        setMessage('Swap completed successfully!');
        return true;
      } else {
        setStatus('failed');
        setError(result.error || 'Swap failed');
        setMessage('Transaction failed');
        return false;
      }
    } catch (err) {
      console.error('Swap execution error:', err);
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMessage('Transaction failed');
      return false;
    }
  }, [isConnected, handleStatusUpdate]);

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash(undefined);
    setMessage('');
    setError(undefined);
  }, []);

  return {
    status,
    txHash,
    message,
    error,
    executeSwap,
    reset,
  };
}
