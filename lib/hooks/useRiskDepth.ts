'use client';

import { useState, useEffect, useCallback } from 'react';
import { type RiskDepth, RISK_DEPTHS } from '@/lib/constants';

const STORAGE_KEY = 'tidal-risk-depth';

export function useRiskDepth() {
  const [riskDepth, setRiskDepthState] = useState<RiskDepth | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in RISK_DEPTHS) {
      setRiskDepthState(stored as RiskDepth);
    }
    setIsLoaded(true);
  }, []);

  // Update localStorage and state
  const setRiskDepth = useCallback((depth: RiskDepth) => {
    localStorage.setItem(STORAGE_KEY, depth);
    setRiskDepthState(depth);
  }, []);

  // Clear preference
  const clearRiskDepth = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRiskDepthState(null);
  }, []);

  // Get config for current depth
  const config = riskDepth ? RISK_DEPTHS[riskDepth] : null;

  return {
    riskDepth,
    setRiskDepth,
    clearRiskDepth,
    isLoaded,
    hasSelected: isLoaded && riskDepth !== null,
    config,
  };
}
