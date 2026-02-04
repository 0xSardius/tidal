'use client';

import { useEffect, useState } from 'react';
import { useAaveRates } from '@/lib/hooks/useAave';

interface RateData {
  apy: number;
  token: string;
}

interface ApiResponse {
  success: boolean;
  rates: Record<string, RateData>;
}

export function YieldRates() {
  const [apiRates, setApiRates] = useState<Record<string, RateData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from API (more reliable than direct RPC in some cases)
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('/api/aave/rates');
        const data: ApiResponse = await res.json();
        if (data.rates) {
          setApiRates(data.rates);
        }
      } catch (err) {
        console.error('Failed to fetch rates:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRates();
  }, []);

  const rates = apiRates || { USDC: { apy: 0, token: 'USDC' }, WETH: { apy: 0, token: 'WETH' } };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
        Live AAVE Rates
      </h3>

      <div className="grid gap-3">
        {/* USDC Rate */}
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">$</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">USDC</p>
              <p className="text-xs text-slate-500">Stablecoin</p>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="w-12 h-5 bg-slate-700 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-semibold text-cyan-400">
                {rates.USDC?.apy?.toFixed(2) || '0.00'}%
              </p>
            )}
            <p className="text-xs text-slate-500">APY</p>
          </div>
        </div>

        {/* WETH Rate */}
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-purple-400">Ξ</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">WETH</p>
              <p className="text-xs text-slate-500">Wrapped Ether</p>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="w-12 h-5 bg-slate-700 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-semibold text-cyan-400">
                {rates.WETH?.apy?.toFixed(2) || '0.00'}%
              </p>
            )}
            <p className="text-xs text-slate-500">APY</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Rates from AAVE V3 on Base
      </p>
    </div>
  );
}
